package api

import (
	"net/http"
	"strconv"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/go-chi/chi/v5"
)

// getScanOr404 fetches a scan, writing an error response if absent.
func (s *Server) getScanOr404(w http.ResponseWriter, r *http.Request) (*scan.Scan, bool) {
	id := chi.URLParam(r, "id")
	scanResult, err := s.orch.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "scan not found")
		return nil, false
	}
	return scanResult, true
}

func (s *Server) getEndpoints(w http.ResponseWriter, r *http.Request) {
	sc, ok := s.getScanOr404(w, r)
	if !ok {
		return
	}

	endpoints, err := s.orch.Store().ListScanEndpoints(sc.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	endpoints = filterEndpoints(endpoints, r)
	writeJSON(w, http.StatusOK, endpoints)
}

func (s *Server) getAttackSurface(w http.ResponseWriter, r *http.Request) {
	sc, ok := s.getScanOr404(w, r)
	if !ok {
		return
	}
	if sc.Status != scan.StatusComplete {
		writeError(w, http.StatusBadRequest, "attack surface is only available for completed scans")
		return
	}
	endpoints, err := s.orch.Store().ListScanEndpoints(sc.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	endpoints = filterEndpoints(endpoints, r)

	methods := map[string]int{}
	statusCodes := map[string]int{}
	riskTotals := map[string]int{}
	for _, e := range endpoints {
		methods[e.Method]++
		if e.StatusCode != 0 {
			key := statusBucket(e.StatusCode)
			statusCodes[key]++
		}
		for risk, n := range e.RiskCounts {
			riskTotals[risk] += n
		}
	}

	writeJSON(w, http.StatusOK, scan.AttackSurface{
		ScanID:      sc.ID,
		Target:      sc.Target,
		Total:       len(endpoints),
		Endpoints:   endpoints,
		MethodCount: methods,
		StatusCount: statusCodes,
		RiskTotals:  riskTotals,
	})
}

func statusBucket(code int) string {
	switch {
	case code >= 500:
		return "5xx"
	case code >= 400:
		return "4xx"
	case code >= 300:
		return "3xx"
	default:
		return "2xx"
	}
}

// filterEndpoints applies optional query filters: method, search text,
// minimum status code.
func filterEndpoints(endpoints []scan.Endpoint, r *http.Request) []scan.Endpoint {
	q := r.URL.Query()
	method := q.Get("method")
	search := lowerTrim(q.Get("search"))
	minStatus, _ := strconv.Atoi(q.Get("minStatus"))

	filtered := make([]scan.Endpoint, 0, len(endpoints))
	for _, e := range endpoints {
		if method != "" && e.Method != method {
			continue
		}
		if minStatus > 0 && e.StatusCode < minStatus {
			continue
		}
		if search != "" && !containsAny(lowerTrim(e.URL), search) &&
			!containsAny(lowerTrim(e.Path), search) {
			continue
		}
		filtered = append(filtered, e)
	}
	return filtered
}

func (s *Server) getAnalytics(w http.ResponseWriter, r *http.Request) {
	sc, ok := s.getScanOr404(w, r)
	if !ok {
		return
	}
	if sc.Status != scan.StatusComplete {
		writeError(w, http.StatusBadRequest, "analytics are only available for completed scans")
		return
	}
	endpoints, _ := s.orch.Store().ListScanEndpoints(sc.ID)
	writeJSON(w, http.StatusOK, scan.AnalyzeScan(sc.ID, sc.Alerts, endpoints))
}

func (s *Server) getFindings(w http.ResponseWriter, r *http.Request) {
	sc, ok := s.getScanOr404(w, r)
	if !ok {
		return
	}
	if sc.Status != scan.StatusComplete {
		writeError(w, http.StatusBadRequest, "findings are only available for completed scans")
		return
	}
	findings := scan.CorrelateFindings(sc.ID, sc.Alerts)
	if risk := r.URL.Query().Get("risk"); risk != "" {
		filtered := findings[:0]
		for _, f := range findings {
			if f.Risk == risk {
				filtered = append(filtered, f)
			}
		}
		findings = filtered
	}
	writeJSON(w, http.StatusOK, findings)
}

func (s *Server) getFinding(w http.ResponseWriter, r *http.Request) {
	sc, ok := s.getScanOr404(w, r)
	if !ok {
		return
	}
	id := chi.URLParam(r, "findingId")
	for _, f := range scan.CorrelateFindings(sc.ID, sc.Alerts) {
		if f.ID == id {
			writeJSON(w, http.StatusOK, f)
			return
		}
	}
	writeError(w, http.StatusNotFound, "finding not found")
}

func lowerTrim(s string) string {
	out := make([]rune, 0, len(s))
	for _, ch := range s {
		if ch >= 'A' && ch <= 'Z' {
			ch += 32
		}
		out = append(out, ch)
	}
	return string(out)
}

func containsAny(haystack, needle string) bool {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return true
		}
	}
	return false
}
