package report

import (
	"html/template"
	"strings"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
)

// reportData is the model for the professional HTML security report.
type reportData struct {
	Scan        *scan.Scan
	Score       scan.ScoreResult
	Findings    []scan.Finding
	Counts      map[string]int
	AffectedURLs []string
}

// buildReportData normalizes the scan, correlates findings, and computes
// everything the report template renders.
func buildReportData(s *scan.Scan) *reportData {
	reportScan := normalizedScan(s)
	score := scan.ScoreScan(reportScan.Alerts)
	findings := scan.CorrelateFindings(reportScan.ID, reportScan.Alerts)

	urlSet := map[string]struct{}{}
	for _, f := range findings {
		for _, u := range f.AffectedURLs {
			urlSet[u] = struct{}{}
		}
	}
	urls := make([]string, 0, len(urlSet))
	for u := range urlSet {
		urls = append(urls, u)
	}
	sortStrings(urls)

	return &reportData{
		Scan:         reportScan,
		Score:        score,
		Findings:     findings,
		Counts:       score.RiskCounts,
		AffectedURLs: urls,
	}
}

func sortStrings(s []string) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j] < s[j-1]; j-- {
			s[j], s[j-1] = s[j-1], s[j]
		}
	}
}

// funcMap provides template helpers. All output is auto-escaped by
// html/template; evidence is rendered in <pre> blocks which escape too.
func funcMap() template.FuncMap {
	return template.FuncMap{
		"scoreColor": func(score int) string {
			switch {
			case score >= 80:
				return "#34d399"
			case score >= 50:
				return "#f59e0b"
			default:
				return "#ef4444"
			}
		},
		"riskClass": func(risk string) string {
			return strings.ToLower(strings.TrimSpace(risk))
		},
	}
}
