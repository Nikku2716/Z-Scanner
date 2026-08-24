package scan

import "sort"

// Analytics aggregates everything the security overview dashboard needs for
// one completed scan: score, severity breakdown, categories, and most
// affected endpoints.
type Analytics struct {
	ScanID          string         `json:"scanId"`
	Score           ScoreResult    `json:"score"`
	Findings        []Finding      `json:"findings"`
	MostAffected    []EndpointHit  `json:"mostAffected"`
	MethodBreakdown map[string]int `json:"methodCounts"`
	StatusCodes     map[string]int `json:"statusCodes,omitempty"` // only when persisted endpoints exist
	TotalEndpoints  int            `json:"totalEndpoints"`
}

// EndpointHit counts how many findings touch an endpoint.
type EndpointHit struct {
	URL          string         `json:"url"`
	Path         string         `json:"path"`
	FindingCount int            `json:"findingCount"`
	Risks        map[string]int `json:"risks"`
}

// AnalyzeScan builds the full analytics payload from a scan's alerts and its
// persisted endpoints (optional — older scans may have none).
func AnalyzeScan(scanID string, alerts []Alert, endpoints []Endpoint) *Analytics {
	score := ScoreScan(alerts)
	findings := CorrelateFindings(scanID, alerts)

	a := &Analytics{
		ScanID:          scanID,
		Score:           score,
		Findings:        findings,
		MethodBreakdown: map[string]int{},
		TotalEndpoints:  len(endpoints),
	}

	hitIndex := make(map[string]*EndpointHit)

	// Findings-derived endpoint hits work even without persisted endpoints.
	for _, f := range findings {
		for _, u := range f.AffectedURLs {
			hit, ok := hitIndex[u]
			if !ok {
				hit = &EndpointHit{URL: u, Path: EndpointPath(u), Risks: map[string]int{}}
				hitIndex[u] = hit
			}
			hit.FindingCount++
			hit.Risks[f.Risk]++
		}
	}

	for _, e := range endpoints {
		a.MethodBreakdown[normalizeMethod(e.Method)]++
		if e.StatusCode != 0 {
			if a.StatusCodes == nil {
				a.StatusCodes = map[string]int{}
			}
			key := statusBucket(e.StatusCode)
			a.StatusCodes[key]++
		}
		if hit, ok := hitIndex[endpointOriginPath(e.URL)]; ok {
			hit.Path = e.Path
		}
	}

	hits := make([]EndpointHit, 0, len(hitIndex))
	for _, h := range hitIndex {
		hits = append(hits, *h)
	}
	sort.SliceStable(hits, func(i, j int) bool {
		if hits[i].FindingCount != hits[j].FindingCount {
			return hits[i].FindingCount > hits[j].FindingCount
		}
		return hits[i].URL < hits[j].URL
	})
	const topN = 10
	if len(hits) > topN {
		hits = hits[:topN]
	}
	a.MostAffected = hits

	return a
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
