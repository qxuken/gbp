# Monitoring

The app exposes Prometheus metrics on a loopback-only port. A home
Prometheus pulls them, and the VPS host metrics, through a Cloudflare Tunnel
guarded by Cloudflare Access. A home Alloy probes the public site:

```
VPS (no inbound ports)                    Cloudflare                  home
┌──────────────────────────────┐          ┌──────────────┐            ┌──────────────────────────┐
│ gbp            127.0.0.1:9091│◀─┐       │ Access:      │  scrape    │ Prometheus               │
│ node-exporter  127.0.0.1:9100│◀─┤tunnel │ Service Auth │◀──────────│  ▲ remote write          │
│ cloudflared ─────────────────┼──┴──────▶│ token only   │  + token   │ Alloy: HTTPS probe       │
└──────────────────────────────┘ (out)    └──────────────┘            │ Grafana ─ alerts ─▶ n8n  │
                                                                      └──────────────────────────┘
```

Nothing on the VPS listens publicly besides the site itself, and `cloudflared`
only dials out. A dead VPS, tunnel or token shows up at home as a failing
scrape (`GbpMetricsMissing`).

| File | What it is |
|---|---|
| [`prometheus-rules.yml`](prometheus-rules.yml) | Alerts: availability, app errors, HTTP errors and latency, failed plan saves, abuse, host |
| [`prometheus-rules.test.yml`](prometheus-rules.test.yml) | `promtool test rules` cases, run in CI |
| [`grafana/gbp-dashboard.json`](grafana/gbp-dashboard.json) | Dashboard: overview, usage, HTTP, host, log entries |

The VPS side (`cloudflared` and `node-exporter` containers) is in the Ansible
`gbp` role (`roles/gbp/tasks/monitoring.yml`).

## App side

`internals/monitoring` is configured through the environment:

| Variable | Default | |
|---|---|---|
| `GBP_METRICS_ADDR` | empty (off); `:9091` in the image | Listen address of `/metrics`. A separate listener, so it is never served on the public port. |
| `GBP_METRICS_TOKEN` | empty | Requires `Authorization: Bearer <token>` on `/metrics` when set. |
| `GBP_LOG_STDOUT` | `false` | Also writes every log entry PocketBase saves to `_logs` to stdout as a JSON line, for a log shipper. Mind that Docker's default `json-file` driver does not rotate. Skipped in dev mode, where PocketBase already prints them. |

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
| `gbp_log_entries_total` | `level`, `type` | log entries PocketBase saved; `type` is `request` (access log) or `app` |
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

Logs are not shipped. `gbp_log_entries_total` turns them into alertable
numbers. The entries themselves are in PocketBase's log viewer
(`https://genshinbuild.app/_/#/logs`, kept for 5 days by default), linked from
the dashboard.

## Setup

### Cloudflare

1. **Tunnel**: Zero Trust → Networks → Tunnels → create a `cloudflared` tunnel
   for the VPS. Copy its token into the vault and set
   `gbp_tunnel_token: "{{ vault_gbp_tunnel_token }}"`.
2. Add two **public hostnames** to that tunnel:

   | Hostname | Path | Service |
   |---|---|---|
   | `gbp-metrics.qxuken.dev` | `^/metrics$` | `http://127.0.0.1:9091` |
   | `gbp-node.qxuken.dev` | `^/metrics$` | `http://127.0.0.1:9100` |

3. **Service token**: Zero Trust → Access → Service credentials → create one for
   the home Prometheus. Note the Client ID and Client Secret.
4. **Access application**: Zero Trust → Access → Applications → self-hosted.
   Add both hostnames as destinations and a single policy with action
   **Service Auth** that includes the service token. Requests without it are
   rejected at the edge.

Check it from anywhere:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://gbp-metrics.qxuken.dev/metrics
```

This should print `403`. With
`-H "CF-Access-Client-Id: …" -H "CF-Access-Client-Secret: …"` it should print
`200`.

If the zone has Bot Fight Mode on, make sure it doesn't challenge the scrapes
(they show up under Security → Events).

### VPS

Run the `pets/gbp.yml` playbook. The role deploys `node-exporter` and
`cloudflared` only when `gbp_tunnel_token` is set. The new gbp image (with
`/metrics`) is published on the next release tag.

### Home

1. **Prometheus**: two scrape jobs, `gbp` and `node`, both
   `scheme: https`, labelled `instance: genshinbuild.app`, with the service
   token in `http_headers` (`CF-Access-Client-Id` / `CF-Access-Client-Secret`,
   as `secrets:` or `files:`).
2. **HTTPS probe**: Alloy's `prometheus.exporter.blackbox` probes
   `https://genshinbuild.app/api/health` and `/`. The results are relabelled to
   `job="blackbox"`, `instance="genshinbuild.app"`, `probe="health|app"` and
   remote-written into Prometheus. That needs Prometheus started with
   `--web.enable-remote-write-receiver`.
3. **Dashboard**: Dashboards → New → Import → upload
   `grafana/gbp-dashboard.json` and pick the Prometheus data source.
4. **Alerts**: Alerting → Alert rules → *Import to Grafana-managed rules*.
   Import `prometheus-rules.yml` with the Prometheus data source. Every rule
   carries `severity` (`critical`/`warning`/`info`) for the notification
   policy that routes to n8n.

## Checking the rules

```bash
docker run --rm --entrypoint promtool -v "$PWD/monitoring:/m" -w /m prom/prometheus:v3.7.3 test rules prometheus-rules.test.yml
```
