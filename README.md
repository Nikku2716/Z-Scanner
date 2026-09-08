# BlackHawk

**BlackHawk** is a web application security assessment platform powered by [OWASP ZAP](https://www.zaproxy.org/). It provides a real-time dashboard to spider websites, run active vulnerability scans, and turn raw scanner output into an analyst-ready security picture — attack surface discovery, deduplicated findings, deterministic risk scoring, scan-over-scan comparison, and professional HTML reports.

Built with a **Go** backend and a **React/Vite** frontend, orchestrated via Docker Compose.

<p align="center">
  <img src="screenshots/screenshot1.png" alt="BlackHawk dashboard screenshot" width="100%">
</p>

---

## Features

### Scanner core

- **4 Scan Modes** — Quick, Fast, Deep, Stealth (capped crawl depth per mode)
- **Real-Time Progress** — Live spider + active scan updates via WebSocket
- **Risk-Based Filtering** — Filter alerts by High / Medium / Low / Informational
- **Stop & Retry** — Cancel running scans, start new ones instantly
- **OWASP Coverage** — XSS, SQL injection, misconfigurations, and more via ZAP
- **Export Results** — Download raw results as JSON or a full assessment as HTML

### Security analytics (v2.0)

- **Attack Surface Discovery** — Every URL ZAP touches is extracted from the site tree and alert data, normalized (lowercase host, default ports stripped, sorted query params, no fragments), deduplicated, and persisted per scan with method, status code, content type, parameters, and discovery time.
- **Vulnerability Correlation** — Raw ZAP alerts are grouped into *findings* using plugin ID + normalized path + parameter + key metadata, so "Cross-Site Scripting — 5 affected endpoints" replaces five indistinguishable duplicates. All original evidence (attack payloads, request URLs) is preserved inside each finding.
- **Deterministic Risk Scoring** — A 0–100 BlackHawk Security Score computed purely from finding severity, confidence, and affected-endpoint scope. Same input → same score, always. See [Scoring Methodology](#scoring-methodology).
- **Security Overview Dashboard** — Score gauge, severity breakdown, vulnerability categories, most-affected endpoints, method/status distribution.
- **Scan Comparison** — Diff any two completed scans: new / fixed / persistent vulnerabilities, added / removed endpoints, and score delta.
- **Professional HTML Report** — Executive summary, target info, scan configuration, score, attack surface summary, detailed findings with evidence and remediation guidance.
- **Finding Detail View** — Drill into any correlated finding: description, severity/confidence, affected URLs, parameter, evidence, impact, remediation, CWE metadata.

---

## Architecture

```
┌───────────────────────────────┐
│  Browser (React/Vite SPA)     │
│  Landing · Dashboard · New    │
│  Scan · Progress · Attack     │
│  Surface · Security Overview  │
│  · Compare · Report           │
└──────────────┬────────────────┘
               │ HTTP + WebSocket
┌──────────────▼────────────────────────────────┐
│  Go API server (chi router)                   │
│                                               │
│  api/        handlers, WS hub, CORS           │
│  scan/       orchestrator (scan lifecycle)    │
│              endpoints.go   normalize+dedupe  │
│              findings.go    alert correlation │
│              scoring.go     deterministic     │
│                             0-100 score       │
│              analytics.go   surface+severity  │
│                             aggregation       │
│              compare.go     scan diffing      │
│              collect.go     endpoint harvest  │
│              store.go       SQLite storage    │
│  report/     HTML assessment generator        │
│  zapclient/  ZAP JSON API client              │
│  config/     env-based configuration          │
└──────────────┬────────────────────────────────┘
               │ REST (JSON)
┌──────────────▼────────────────┐      ┌──────────────────────┐
│  OWASP ZAP daemon             │      │  SQLite scans.db     │
│  spider · passive · ascan     │      │  scans · alerts ·    │
│  alerts · site tree           │      │  endpoints           │
└───────────────────────────────┘      └──────────────────────┘
```

Data flow: the orchestrator drives ZAP through `zapclient`, harvests discovered endpoints via the endpoint collector (`collect.go`) which normalizes/deduplicates before persistence in SQLite, correlates raw alerts into findings (`findings.go`), scores them (`scoring.go`), and exposes everything through the API layer.

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Go 1.22+ and Node 20+ for local development

### Run with Docker

```bash
git clone https://github.com/sh4dowbl4d3/BlackHawk.git
cd BlackHawk
docker compose up --build
```

- Frontend: http://localhost:5174
- Backend API: http://localhost:8081
- ZAP daemon: http://localhost:8080

To override the default ZAP API key, create a local `.env` file:

```bash
ZAP_API_KEY=changeme
```

### Local Development

**Terminal 1 — ZAP:**
```bash
docker run -p 8080:8080 ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.key=changeme \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true
```

**Terminal 2 — Backend:**
```bash
cd backend
go run ./cmd/server
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

All backend configuration is environment-driven (no hardcoded values):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8081` | API listen port |
| `ZAP_HOST` | `http://localhost:8080` | ZAP daemon base URL |
| `ZAP_API_KEY` | `changeme` | ZAP API key |
| `CORS_ORIGIN` | `http://localhost:5174` | Allowed browser origin |
| `STORE_PATH` | `scans.db` | SQLite database path |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scan` | Start a new scan |
| GET | `/api/scans` | List scan history |
| GET | `/api/status/:id` | Get scan status |
| POST | `/api/stop/:id` | Stop a running scan |
| DELETE | `/api/scan/:id` | Delete a scan |
| GET | `/api/report/:id` | Get raw scan report (JSON) |
| GET | `/api/report/:id/html` | Export professional HTML assessment |
| GET | `/api/ws/:id` | WebSocket for live progress |

### Analytics endpoints (v2.0)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scan/:id/endpoints` | Discovered endpoints; optional `?method=`, `?search=`, `?minStatus=` filters |
| GET | `/api/scan/:id/surface` | Attack surface aggregate: totals, method/status/risk distributions |
| GET | `/api/scan/:id/analytics` | Full analytics: score, risk counts, categories, most-affected endpoints |
| GET | `/api/scan/:id/findings` | Correlated findings; optional `?risk=` filter |
| GET | `/api/scan/:id/findings/:findingId` | Single finding with all preserved evidence |
| GET | `/api/compare/:baseId/:targetId` | Deterministic diff of two completed scans |

Completed-scan-only endpoints return `400` for scans that are still running or failed.

---

## Scoring Methodology

The **BlackHawk Security Score** is a deterministic 0–100 prioritization aid — it is **not CVSS** (ZAP does not emit CVSS vectors). CWE/WASC identifiers from ZAP are surfaced separately on each finding.

```
score = clamp(100 − Σ deductions, 0, 100)

deduction(finding) = severityWeight × confidenceMultiplier × scopeFactor

severityWeight:      High 15 · Medium 7 · Low 2 · Informational 0.5
confidenceMultiplier: Confirmed/Firm 1.0 · Low 0.5 · other/empty 0.25
scopeFactor:         1 + min(affectedEndpoints−1, 4) × 0.2   (max 1.8×)
```

Properties:

- **Deterministic** — identical inputs always yield identical outputs (no randomness, no wall-clock dependence); covered by unit tests.
- **Severity-dominant** — one High finding costs roughly twice a Medium.
- **Confidence-aware** — speculative findings count less than confirmed ones.
- **Scope-aware but saturating** — spread across more endpoints increases impact up to a cap so a single noisy finding can't zero the score.
- The methodology string is embedded verbatim in every analytics API response.

---

## Vulnerability Correlation

Raw ZAP alerts frequently contain exact or near duplicates (same issue hit at several URLs or re-reported across phases). BlackHawk groups them into **findings** keyed by:

- plugin ID,
- alert name.

Each finding aggregates its affected URLs and retains the original alerts (URL, method, param, attack payload, evidence) so no analyst-relevant evidence is lost. This matches how professional security tools (Burp Suite, Nessus, Qualys) present findings — by vulnerability class, not by individual instance. "Absence of Anti-CSRF Tokens" across 6 pages appears as one finding with 6 affected URLs, not 6 identical-looking entries.

---

## Scan Comparison

Compare any two completed scans deterministically:

```
SCAN #12 → SCAN #15

Security Score: 61 → 78 (+17)
New vulnerabilities:  2
Fixed vulnerabilities: 7
Persistent vulnerabilities: 5
Endpoints: +3 new, −2 removed
```

Findings are matched between scans by correlation identity (plugin ID + name + path + param), endpoints by normalized URL + method. The comparison is pure and unit-tested — same two scans always produce the same diff.

---

## Example Workflow

```bash
# 1. Start the stack
docker compose up --build

# 2. Launch a deep scan of your local test target
curl -X POST localhost:8081/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"target":"http://testphp.vulnweb.com","mode":"deep"}'
# → {"id":"…","status":"pending", …}

# 3. Watch progress (browser or WebSocket)
open localhost:5174/scan/<id>
# or: wscat -c ws://localhost:8081/api/ws/<id>

# 4. Review the security picture
curl localhost:8081/api/scan/<id>/analytics   # score + severity breakdown
curl localhost:8081/api/scan/<id>/surface     # attack surface
curl "localhost:8081/api/scan/<id>/findings?risk=High"

# 5. Fix what you can, rescan, then prove improvement
curl -X POST localhost:8081/api/scan -d '{"target":"http://testphp.vulnweb.com","mode":"deep"}' ...
curl localhost:8081/api/compare/<old-id>/<new-id>

# 6. Ship the report
open localhost:8081/api/report/<new-id>/html
```

> Only scan systems you are explicitly authorized to test — e.g. locally running intentionally vulnerable applications such as OWASP Juice Shop or DVWA. BlackHawk is a defensive assessment tool; it does not include functionality to bypass authorization or evade detection.

---

## Testing

```bash
# Backend unit + integration tests (correlation, scoring, comparison, API)
cd backend && go test ./...

# Frontend production build (type-checked)
cd frontend && npm run build
```

Test coverage highlights: endpoint normalization & deduplication, alert correlation with duplicates and missing fields, scoring determinism and edge cases (empty scans, unknown severities), comparison engine symmetry, and API integration tests including 404/400 paths.

For end-to-end testing without a real ZAP, a mock daemon is included:

```bash
python3 backend/tools/mockzap.py &                 # serves a fake ZAP on :8099
cd backend
PORT=18081 ZAP_HOST=http://127.0.0.1:8099 STORE_PATH=/tmp/scans.db go run ./cmd/server
# then drive scans against localhost:18081 as above
```

---

## Project Structure

```
BlackHawk/
├── docker-compose.yml
├── backend/            # Go API + ZAP orchestration + analytics
│   ├── cmd/server/     # entrypoint
│   └── internal/
│       ├── api/        # chi handlers, WebSocket hub, CORS
│       ├── scan/       # models, orchestrator, endpoints, findings,
│       │               # scoring, analytics, comparison, store (SQLite)
│       ├── report/     # HTML assessment generator
│       ├── zapclient/  # ZAP JSON API client
│       └── config/     # env configuration
├── frontend/           # React/Vite dashboard
│   └── src/pages/      # Landing, Dashboard, NewScan, ScanProgress,
│                       # AttackSurface, SecurityOverview, Compare,
│                       # Report, Capabilities
└── screenshots/
```

---

## Roadmap / Known Limitations

- PDF export is not yet available (HTML report is print-friendly; `Ctrl+P` works well).
- Endpoint status codes depend on what ZAP's site tree reports; not-found pages may be absent.
- Comparison requires both scans to have reached `complete` status.
- Scheduled/recurring scans and multi-user auth are candidates for future releases.

---

## License

[GNU GPLv3](LICENSE)
