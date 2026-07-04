package report

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"html/template"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
)

//go:embed templates/report.html
var reportTemplate string

type Generator struct{}

func New() *Generator {
	return &Generator{}
}

func (g *Generator) GenerateJSON(s *scan.Scan) ([]byte, error) {
	reportScan := normalizedScan(s)
	return json.MarshalIndent(reportScan, "", "  ")
}

type reportData struct {
	Scan   *scan.Scan
	Counts map[string]int
}

func (g *Generator) GenerateHTML(s *scan.Scan) ([]byte, error) {
	tmpl, err := template.New("report").Parse(reportTemplate)
	if err != nil {
		return nil, fmt.Errorf("parse template: %w", err)
	}

	reportScan := normalizedScan(s)
	counts := map[string]int{}
	for _, a := range reportScan.Alerts {
		counts[a.Risk]++
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, reportData{Scan: reportScan, Counts: counts}); err != nil {
		return nil, fmt.Errorf("execute template: %w", err)
	}
	return buf.Bytes(), nil
}

func normalizedScan(s *scan.Scan) *scan.Scan {
	reportScan := *s
	reportScan.Alerts = scan.DeduplicateAlerts(s.Alerts)
	scan.SortAlertsByRisk(reportScan.Alerts)
	return &reportScan
}
