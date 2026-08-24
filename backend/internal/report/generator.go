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

func (g *Generator) GenerateHTML(s *scan.Scan) ([]byte, error) {
	tmpl, err := template.New("report").Funcs(funcMap()).Parse(reportTemplate)
	if err != nil {
		return nil, fmt.Errorf("parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, buildReportData(s)); err != nil {
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
