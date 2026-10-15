package monitoring

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/qxuken/gbp/internals/models"
)

// usageCacheTTL bounds how often a scrape actually queries the db.
const usageCacheTTL = 30 * time.Second

var usageWindows = []struct {
	label string
	d     time.Duration
}{
	{"1d", 24 * time.Hour},
	{"7d", 7 * 24 * time.Hour},
	{"30d", 30 * 24 * time.Hour},
}

var plansPerUserBuckets = []float64{0, 1, 3, 5, 10, 20, 40, 80, 160}

// dbFiles are the PocketBase data dir files reported by gbp_db_size_bytes.
var dbFiles = []string{"data.db", "data.db-wal", "auxiliary.db", "auxiliary.db-wal"}

// usageCollector reports aggregated usage numbers computed from the db at
// scrape time. Nothing per user is exported as a label, only distributions.
type usageCollector struct {
	app core.App

	up           *prometheus.Desc
	users        *prometheus.Desc
	usersNew     *prometheus.Desc
	usersActive  *prometheus.Desc
	planRecords  *prometheus.Desc
	plansPerUser *prometheus.Desc
	plansMax     *prometheus.Desc
	dictionary   *prometheus.Desc
	dbSize       *prometheus.Desc

	mu       sync.Mutex
	cachedAt time.Time
	cached   []prometheus.Metric
}

func newUsageCollector(app core.App) *usageCollector {
	return &usageCollector{
		app: app,
		up: prometheus.NewDesc("gbp_usage_up",
			"Whether the last usage metrics query succeeded.", nil, nil),
		users: prometheus.NewDesc("gbp_users",
			"Registered users by email verification state.", []string{"verified"}, nil),
		usersNew: prometheus.NewDesc("gbp_users_new",
			"Users registered within the window.", []string{"window"}, nil),
		usersActive: prometheus.NewDesc("gbp_users_active",
			"Users with a plan record created or edited within the window.", []string{"window"}, nil),
		planRecords: prometheus.NewDesc("gbp_plan_records",
			"Records stored per plans collection.", []string{"collection"}, nil),
		plansPerUser: prometheus.NewDesc("gbp_character_plans_per_user",
			"Distribution of character plans per registered user (users without plans included).", nil, nil),
		plansMax: prometheus.NewDesc("gbp_character_plans_per_user_max",
			"Highest character plans count of a single user.", nil, nil),
		dictionary: prometheus.NewDesc("gbp_dictionary_info",
			"Currently applied dictionary seed hash, always 1.", []string{"version"}, nil),
		dbSize: prometheus.NewDesc("gbp_db_size_bytes",
			"Size of the PocketBase db files.", []string{"file"}, nil),
	}
}

func (c *usageCollector) Describe(ch chan<- *prometheus.Desc) {
	for _, d := range []*prometheus.Desc{
		c.up, c.users, c.usersNew, c.usersActive, c.planRecords,
		c.plansPerUser, c.plansMax, c.dictionary, c.dbSize,
	} {
		ch <- d
	}
}

func (c *usageCollector) Collect(ch chan<- prometheus.Metric) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.cached == nil || time.Since(c.cachedAt) > usageCacheTTL {
		metrics, err := c.gather()
		if err != nil {
			c.app.Logger().Warn("Failed to gather usage metrics", "error", err.Error())
			metrics = []prometheus.Metric{prometheus.MustNewConstMetric(c.up, prometheus.GaugeValue, 0)}
		} else {
			metrics = append(metrics, prometheus.MustNewConstMetric(c.up, prometheus.GaugeValue, 1))
		}
		c.cached = metrics
		c.cachedAt = time.Now()
	}

	for _, m := range c.cached {
		ch <- m
	}
}

func (c *usageCollector) gather() ([]prometheus.Metric, error) {
	db := c.app.DB()
	var out []prometheus.Metric
	gauge := func(desc *prometheus.Desc, v float64, labels ...string) {
		out = append(out, prometheus.MustNewConstMetric(desc, prometheus.GaugeValue, v, labels...))
	}

	var total, verified int
	err := db.NewQuery("SELECT COUNT(*), COALESCE(SUM([[verified]]), 0) FROM {{"+models.USERS_COLLECTION_NAME+"}}").
		Row(&total, &verified)
	if err != nil {
		return nil, fmt.Errorf("users: %w", err)
	}
	gauge(c.users, float64(verified), "true")
	gauge(c.users, float64(total-verified), "false")

	activeQuery := activeUsersQuery()
	for _, w := range usageWindows {
		since := types.NowDateTime().Add(-w.d).String()

		var n int
		err := db.NewQuery("SELECT COUNT(*) FROM {{" + models.USERS_COLLECTION_NAME + "}} WHERE [[created]] >= {:since}").
			Bind(dbx.Params{"since": since}).
			Row(&n)
		if err != nil {
			return nil, fmt.Errorf("new users: %w", err)
		}
		gauge(c.usersNew, float64(n), w.label)

		if err := db.NewQuery(activeQuery).Bind(dbx.Params{"since": since}).Row(&n); err != nil {
			return nil, fmt.Errorf("active users: %w", err)
		}
		gauge(c.usersActive, float64(n), w.label)
	}

	for _, collection := range models.PLANS_COLLECTIONS {
		var n int
		if err := db.NewQuery("SELECT COUNT(*) FROM {{" + collection + "}}").Row(&n); err != nil {
			return nil, fmt.Errorf("%s: %w", collection, err)
		}
		gauge(c.planRecords, float64(n), collection)
	}

	var perUser []int
	err = db.NewQuery(
		"SELECT COUNT(cp.[[id]]) FROM {{" + models.USERS_COLLECTION_NAME + "}} u" +
			" LEFT JOIN {{" + models.CHARACTER_PLANS_COLLECTION_NAME + "}} cp ON cp.[[user]] = u.[[id]]" +
			" GROUP BY u.[[id]]",
	).Column(&perUser)
	if err != nil {
		return nil, fmt.Errorf("plans per user: %w", err)
	}
	count, sum, buckets := histogram(perUser, plansPerUserBuckets)
	out = append(out, prometheus.MustNewConstHistogram(c.plansPerUser, count, sum, buckets))
	maxPlans := 0
	if len(perUser) > 0 {
		maxPlans = slices.Max(perUser)
	}
	gauge(c.plansMax, float64(maxPlans))

	if setting, err := models.FindAppSettingsByKey(c.app, "dictionaryVersion"); err == nil {
		gauge(c.dictionary, 1, setting.Value())
	}

	for _, name := range dbFiles {
		if info, err := os.Stat(filepath.Join(c.app.DataDir(), name)); err == nil {
			gauge(c.dbSize, float64(info.Size()), name)
		}
	}

	return out, nil
}

// activeUsersQuery counts the distinct owners of plan records touched since
// {:since}; nested plans are attributed through their character plan.
func activeUsersQuery() string {
	parts := make([]string, 0, len(models.PLANS_COLLECTIONS))
	for _, collection := range models.PLANS_COLLECTIONS {
		if collection == models.CHARACTER_PLANS_COLLECTION_NAME {
			parts = append(parts, "SELECT [[user]] AS u FROM {{"+collection+"}} WHERE [[updated]] >= {:since}")
			continue
		}
		parts = append(parts,
			"SELECT cp.[[user]] AS u FROM {{"+collection+"}} p"+
				" JOIN {{"+models.CHARACTER_PLANS_COLLECTION_NAME+"}} cp ON cp.[[id]] = p.[[characterPlan]]"+
				" WHERE p.[[updated]] >= {:since}")
	}
	return "SELECT COUNT(DISTINCT u) FROM (" + strings.Join(parts, " UNION ALL ") + ")"
}

// histogram builds the cumulative bucket counts of values for a const histogram.
func histogram(values []int, bounds []float64) (uint64, float64, map[float64]uint64) {
	buckets := make(map[float64]uint64, len(bounds))
	var sum float64
	for _, v := range values {
		sum += float64(v)
		for _, b := range bounds {
			if float64(v) <= b {
				buckets[b]++
			}
		}
	}
	return uint64(len(values)), sum, buckets
}
