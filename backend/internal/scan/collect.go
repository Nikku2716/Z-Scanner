package scan

import (
	"fmt"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/ghost0/BlackHawk/backend/internal/zapclient"
)

// EndpointCollector turns raw ZAP discovery data (site tree, spider URLs,
// alerts) into normalized, deduplicated Endpoint records.
type EndpointCollector struct {
	store *Store
}

func NewEndpointCollector(store *Store) *EndpointCollector {
	return &EndpointCollector{store: store}
}

// CollectFromZAP builds the endpoint inventory for a completed scan from the
// ZAP site tree, spider URL list, and alert set. Persistence failures are
// returned to the caller — a failed collection must not be silently dropped.
func (c *EndpointCollector) CollectFromZAP(scanID, target string, zapAlerts []zapclient.ZAPAlert) ([]Endpoint, error) {
	endpoints := extractEndpoints(target, zapAlerts)
	SortEndpoints(endpoints)
	if err := c.store.ReplaceScanEndpoints(scanID, endpoints); err != nil {
		return nil, fmt.Errorf("persist endpoints: %w", err)
	}
	return endpoints, nil
}

// extractEndpoints merges site-tree nodes, discovered URLs, and alert
// metadata into one deduplicated endpoint list.
func extractEndpoints(target string, zapAlerts []zapclient.ZAPAlert) []Endpoint {
	now := time.Now().UTC()
	byKey := make(map[string]*Endpoint)

	add := func(e Endpoint) {
		e.URL = NormalizeEndpointURL(e.URL)
		if e.URL == "" || !sameHost(e.URL, target) && target != "" {
			return
		}
		e.Method = normalizeMethod(e.Method)
		e.Path = EndpointPath(e.URL)
		key := endpointDedupKey(e)
		if existing, ok := byKey[key]; ok {
			if existing.StatusCode == 0 {
				existing.StatusCode = e.StatusCode
			}
			if existing.ContentType == "" {
				existing.ContentType = e.ContentType
			}
			for risk, n := range e.RiskCounts {
				existing.RiskCounts[risk] += n
			}
			for _, p := range e.Params {
				if !contains(existing.Params, p) {
					existing.Params = append(existing.Params, p)
				}
			}
			sort.Strings(existing.Params)
			return
		}
		e.ScanID = ""
		e.ID = ""
		e.DiscoveredAt = now
		record := e
		byKey[key] = &record
	}

	// Alerts carry method, parameter, status evidence, and risk attribution.
	for _, a := range zapAlerts {
		method := a.Method
		params := []string{}
		if a.Param != "" {
			params = append(params, a.Param)
		} else if q := queryParamNames(a.URL); len(q) > 0 {
			params = q
		}
		riskCounts := map[string]int{}
		if a.Risk != "" {
			riskCounts[a.Risk] = 1
		}
		add(Endpoint{
			URL:        a.URL,
			Method:     method,
			StatusCode: 0,
			Params:     params,
			RiskCounts: riskCounts,
		})
	}

	endpoints := make([]Endpoint, 0, len(byKey))
	for _, e := range byKey {
		endpoints = append(endpoints, *e)
	}
	SortEndpoints(endpoints)
	return endpoints
}

// sameHost reports whether the normalized candidate URL belongs to the same
// host as the scan target. Empty targets accept everything.
func sameHost(candidateURL, target string) bool {
	if target == "" {
		return true
	}
	cu, err := url.Parse(candidateURL)
	if err != nil {
		return false
	}
	tu, err := url.Parse(NormalizeEndpointURL(target))
	if err != nil {
		return true
	}
	return strings.EqualFold(cu.Hostname(), tu.Hostname())
}

func contains(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}

// queryParamNames extracts unique query parameter names from a URL.
func queryParamNames(raw string) []string {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || len(u.Query()) == 0 {
		return nil
	}
	names := make([]string, 0, len(u.Query()))
	for k := range u.Query() {
		names = append(names, k)
	}
	sort.Strings(names)
	return names
}
