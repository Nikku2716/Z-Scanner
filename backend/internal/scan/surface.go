package scan

// AttackSurface is the aggregated attack-surface view for one scan.
type AttackSurface struct {
	ScanID      string         `json:"scanId"`
	Target      string         `json:"target"`
	Total       int            `json:"total"`
	Endpoints   []Endpoint     `json:"endpoints"`
	MethodCount map[string]int `json:"methodCounts"`
	StatusCount map[string]int `json:"statusCounts"`
	RiskTotals  map[string]int `json:"riskTotals"`
}
