package monitoring

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/qxuken/gbp/internals/models"
)

// authMethods are the RecordAuthRequestEvent.AuthMethod values pre-initialized
// to zero; an auth refresh carries an empty method and is reported as "refresh".
var authMethods = []string{core.MFAMethodPassword, core.MFAMethodOAuth2, core.MFAMethodOTP, "refresh"}

// bindRecordMetrics counts writes to the users and plans collections and
// successful user authentications.
func bindRecordMetrics(app core.App, reg prometheus.Registerer) {
	writes := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "gbp_record_writes_total",
		Help: "Successful record writes by collection and operation.",
	}, []string{"collection", "op"})
	auths := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "gbp_auth_total",
		Help: "Successful user authentications by method.",
	}, []string{"method"})
	reg.MustRegister(writes, auths)

	collections := append([]string{models.USERS_COLLECTION_NAME}, models.PLANS_COLLECTIONS...)
	for _, collection := range collections {
		for _, op := range []string{"create", "update", "delete"} {
			writes.WithLabelValues(collection, op)
		}
	}
	for _, method := range authMethods {
		auths.WithLabelValues(method)
	}

	countWrite := func(op string) func(e *core.RecordEvent) error {
		return func(e *core.RecordEvent) error {
			writes.WithLabelValues(e.Record.Collection().Name, op).Inc()
			return e.Next()
		}
	}
	app.OnRecordAfterCreateSuccess(collections...).BindFunc(countWrite("create"))
	app.OnRecordAfterUpdateSuccess(collections...).BindFunc(countWrite("update"))
	app.OnRecordAfterDeleteSuccess(collections...).BindFunc(countWrite("delete"))

	app.OnRecordAuthRequest(models.USERS_COLLECTION_NAME).BindFunc(func(e *core.RecordAuthRequestEvent) error {
		if err := e.Next(); err != nil {
			return err
		}
		method := e.AuthMethod
		if method == "" {
			method = "refresh"
		}
		auths.WithLabelValues(method).Inc()
		return nil
	})
}
