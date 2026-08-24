package scan

import (
	"net/url"
	"sort"
	"strings"
	"time"
)

// Endpoint represents a discovered URL on a scanned target. Endpoints are
// extracted from ZAP's site tree and alert data, then normalized so that
// trivially identical entries deduplicate cleanly.
type Endpoint struct {
	ID           string            `json:"id"`
	ScanID       string            `json:"scanId"`
	URL          string            `json:"url"`
	Path         string            `json:"path"`
	Method       string            `json:"method"`
	StatusCode   int               `json:"statusCode,omitempty"`
	ContentType  string            `json:"contentType,omitempty"`
	Params       []string          `json:"params,omitempty"`
	RiskCounts   map[string]int    `json:"riskCounts,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
	DiscoveredAt time.Time         `json:"discoveredAt"`
}

// NormalizeEndpointURL canonicalizes a raw URL for storage and comparison:
// lowercase scheme/host, strip default ports, drop fragment, sort query
// parameters, and trim trailing slash ambiguity (except on root paths).
func NormalizeEndpointURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return strings.TrimRight(raw, "/")
	}

	u.Scheme = strings.ToLower(u.Scheme)
	u.Host = strings.ToLower(u.Host)
	if (u.Scheme == "http" && u.Port() == "80") || (u.Scheme == "https" && u.Port() == "443") {
		u.Host = u.Hostname()
	}
	u.Fragment = ""

	if len(u.Query()) > 0 {
		keys := make([]string, 0, len(u.Query()))
		for k := range u.Query() {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		q := url.Values{}
		for _, k := range keys {
			for _, v := range u.Query()[k] {
				q.Add(k, v)
			}
		}
		u.RawQuery = q.Encode()
	}

	normalized := u.String()
	if strings.HasSuffix(normalized, "/") && u.Path != "/" && u.RawQuery == "" {
		normalized = strings.TrimSuffix(normalized, "/")
	}
	return normalized
}

// EndpointPath returns the decoded path (+query) portion of a normalized URL.
func EndpointPath(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	path := u.EscapedPath()
	if path == "" {
		return "/"
	}
	return path
}

func normalizeMethod(method string) string {
	method = strings.ToUpper(strings.TrimSpace(method))
	if method == "" {
		return "GET"
	}
	return method
}

// endpointDedupKey identifies an endpoint by normalized origin, path, method,
// and parameter names. Query values are deliberately excluded —
// /search?q=1 and /search?q=2 are one endpoint with one parameter.
func endpointDedupKey(e Endpoint) string {
	names := append([]string(nil), e.Params...)
	sort.Strings(names)
	return strings.Join([]string{
		endpointOriginPath(e.URL),
		normalizeMethod(e.Method),
		strings.Join(names, ","),
	}, "|")
}

// endpointOriginPath returns scheme://host + decoded path of a raw URL,
// falling back to the raw string when it cannot be parsed as a URL.
func endpointOriginPath(raw string) string {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u.Scheme == "" || u.Host == "" {
		return strings.TrimRight(raw, "/")
	}
	path := u.Path
	if len(path) > 1 {
		path = strings.TrimRight(path, "/")
	}
	return strings.ToLower(u.Scheme) + "://" + strings.ToLower(u.Host) + path
}

// DeduplicateEndpoints collapses repeated endpoint records, keeping the first
// occurrence of each unique (URL, method, params) combination and merging
// status codes, content types, and risk counts into it.
func DeduplicateEndpoints(endpoints []Endpoint) []Endpoint {
	if len(endpoints) < 2 {
		return endpoints
	}

	index := make(map[string]*Endpoint, len(endpoints))
	order := make([]string, 0, len(endpoints))

	for _, e := range endpoints {
		key := endpointDedupKey(e)
		if existing, ok := index[key]; ok {
			if existing.StatusCode == 0 {
				existing.StatusCode = e.StatusCode
			}
			if existing.ContentType == "" {
				existing.ContentType = e.ContentType
			}
			for risk, n := range e.RiskCounts {
				existing.RiskCounts[risk] += n
			}
			continue
		}
		record := e
		index[key] = &record
		order = append(order, key)
	}

	unique := make([]Endpoint, 0, len(order))
	for _, key := range order {
		unique = append(unique, *index[key])
	}
	return unique
}

// SortEndpoints orders endpoints deterministically by method then URL.
func SortEndpoints(endpoints []Endpoint) {
	sort.SliceStable(endpoints, func(i, j int) bool {
		mi, mj := normalizeMethod(endpoints[i].Method), normalizeMethod(endpoints[j].Method)
		if mi != mj {
			return mi < mj
		}
		return endpoints[i].URL < endpoints[j].URL
	})
}
