# Monitoring

The app exposes Prometheus metrics and writes JSON logs to stdout. A Grafana
Alloy container next to it on the VPS ships both, plus host metrics and an
HTTPS probe, to a Prometheus + Loki + Grafana stack elsewhere:

```
VPS                                               home
┌───────────────────────────────────┐             ┌──────────────────────────┐
│ gbp ─ 127.0.0.1:9091/metrics ─┐   │  remote     │ Prometheus ── rules ──┐  │
│     └─ stdout (JSON logs) ─┐  │   │  write      │                       │  │
│                            ▼  ▼   │ ──────────▶ │ Loki ───── rules ─────┤  │
│ alloy: scrape, docker logs,       │  push       │                       ▼  │
│        node exporter, blackbox    │             │ Grafana ── alerts ─▶ n8n │
└───────────────────────────────────┘             └──────────────────────────┘
```

Alloy only makes outbound connections, so nothing new is opened on the VPS. A
dead VPS shows up at home as missing data (`GbpMetricsMissing`).

| File | What it is |
|---|---|
| [`prometheus-rules.yml`](prometheus-rules.yml) | Metric alerts (availability, HTTP errors and latency, failed plan saves, abuse, host) |
| [`prometheus-rules.test.yml`](prometheus-rules.test.yml) | `promtool test rules` cases, run in CI |
| [`loki-rules.yml`](loki-rules.yml) | Log alerts (app errors, logs stopped arriving) |
| [`grafana/gbp-dashboard.json`](grafana/gbp-dashboard.json) | Dashboard: overview, usage, HTTP, host, logs |

The Alloy config and its container live in the Ansible `gbp` role
(`roles/gbp/templates/config.alloy.j2`, `roles/gbp/tasks/alloy.yml`).

## App side

`internals/monitoring` is configured through the environment:

| Variable | Default | |
|---|---|---|
| `GBP_METRICS_ADDR` | empty (off); `:9091` in the image | Listen address of `/metrics`. A separate listener, so it is never served on the public port. |
| `GBP_METRICS_TOKEN` | empty | Requires `Authorization: Bearer <token>` on `/metrics` when set. |
| `GBP_LOG_STDOUT` | `true` | Mirrors every log entry PocketBase saves to `_logs` to stdout as a JSON line. Skipped in dev mode, where PocketBase already prints them. |

The image version comes from the `VERSION` build arg (the git tag in
`release.yml`) and is reported by `gbp_build_info`.

### Metrics

| Metric | Labels | |
|---|---|---|
| `gbp_build_info` | `version`, `goversion` | always 1 |
| `gbp_http_requests_total` | `method`, `route`, `status` | `route` is the matched pattern, e.g. `/api/collections/{collection}/records` |
| `gbp_http_request_duration_seconds` | `method`, `route` | histogram |
| `gbp_http_requests_in_flight` | | |
| `gbp_record_writes_total` | `collection`, `op` | users and plans collections; `op` is `create`/`update`/`delete` |
| `gbp_auth_total` | `method` | successful logins: `password`, `oauth2`, `otp`, `refresh` (a returning session) |
| `gbp_users` | `verified` | |
| `gbp_users_new` | `window` | registered within `1d`/`7d`/`30d` |
| `gbp_users_active` | `window` | users with a plan record created or edited within the window |
| `gbp_plan_records` | `collection` | records per plans collection |
| `gbp_character_plans_per_user` | | histogram over all users (0 bucket = users without plans) |
| `gbp_character_plans_per_user_max` | | |
| `gbp_dictionary_info` | `version` | applied seed hash |
| `gbp_db_size_bytes` | `file` | `data.db`, `auxiliary.db` and their WALs |
| `gbp_usage_up` | | 0 when the usage queries fail |

Plus the standard `go_*` and `process_*` collectors. The usage gauges are
computed with a few `COUNT` queries at scrape time, cached for 30s. Nothing is
labelled per user.

### Logs

Each line is the PocketBase log entry as JSON: `time`, `level`, `msg` plus its
data. Access logs carry `type="request"`, `status`, `method`, `url`,
`execTime`, `error`, `details`, `userIP`, …. Alloy promotes `level` and `type`
to Loki labels. Everything else is available through `| json`.

## Home side

1. **Prometheus** must accept remote write: start it with
   `--web.enable-remote-write-receiver`. The endpoint is `/api/v1/write`.
2. **Loki** accepts pushes on `/loki/api/v1/push` by default.
3. **Make both reachable from the VPS**, either:
   - over a private tunnel (WireGuard/Tailscale) to plain `http://` URLs, or
   - through your reverse proxy with TLS and basic auth. Set
     `gbp_monitoring_basic_auth: true` and put `gbp_monitoring_password` in the
     vault.
4. Set `gbp_monitoring_prometheus_url` and `gbp_monitoring_loki_url` for the
   host and run the `pets/gbp.yml` playbook. Alloy is skipped while either URL
   is empty.
5. **Dashboard**: Dashboards → New → Import → upload
   `grafana/gbp-dashboard.json`, then pick the Prometheus and Loki data sources.
6. **Alerts**: Alerting → Alert rules → *Import to Grafana-managed rules*. Import
   `prometheus-rules.yml` with the Prometheus data source and `loki-rules.yml`
   with Loki. Every rule carries `severity` (`critical`/`warning`/`info`) for the
   notification policy that routes to n8n. Alternatively, load the files
   straight into Prometheus `rule_files` and the Loki ruler.

## Checking the rules

```bash
docker run --rm --entrypoint promtool -v "$PWD/monitoring:/m" -w /m prom/prometheus:v3.7.3 test rules prometheus-rules.test.yml
```
