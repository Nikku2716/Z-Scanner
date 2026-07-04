package scan

import "time"

type Status string

const (
	StatusPending  Status = "pending"
	StatusRunning  Status = "running"
	StatusComplete Status = "complete"
	StatusFailed   Status = "failed"
	StatusStopped  Status = "stopped"
)

type Mode string

const (
	ModeQuick   Mode = "quick"
	ModeFast    Mode = "fast"
	ModeDeep    Mode = "deep"
	ModeStealth Mode = "stealth"
)

type ScanConfig struct {
	Mode        Mode `json:"mode"`
	MaxChildren int  `json:"maxChildren"`
}

type Alert struct {
	ID          string `json:"id"`
	PluginID    string `json:"pluginId"`
	Name        string `json:"name"`
	Risk        string `json:"risk"`
	Confidence  string `json:"confidence"`
	URL         string `json:"url"`
	Method      string `json:"method"`
	Param       string `json:"param"`
	Attack      string `json:"attack,omitempty"`
	Evidence    string `json:"evidence,omitempty"`
	Description string `json:"description"`
	Solution    string `json:"solution"`
	Reference   string `json:"reference"`
	CWEID       string `json:"cweid"`
}

type Progress struct {
	Phase         string `json:"phase"`
	SpiderPercent int    `json:"spiderPercent"`
	ActivePercent int    `json:"activePercent"`
	PassiveQueue  int    `json:"passiveQueue"`
	Message       string `json:"message"`
}

type Scan struct {
	ID        string     `json:"id"`
	Target    string     `json:"target"`
	Config    ScanConfig `json:"config"`
	Status    Status     `json:"status"`
	Progress  Progress   `json:"progress"`
	Alerts    []Alert    `json:"alerts"`
	Error     string     `json:"error,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
}

func DefaultConfig(mode Mode) ScanConfig {
	switch mode {
	case ModeQuick:
		return ScanConfig{Mode: mode, MaxChildren: 5}
	case ModeFast:
		return ScanConfig{Mode: mode, MaxChildren: 20}
	case ModeDeep:
		return ScanConfig{Mode: mode, MaxChildren: 100}
	case ModeStealth:
		return ScanConfig{Mode: mode, MaxChildren: 10}
	default:
		return ScanConfig{Mode: ModeQuick, MaxChildren: 5}
	}
}

func RiskOrder(risk string) int {
	switch risk {
	case "High":
		return 0
	case "Medium":
		return 1
	case "Low":
		return 2
	case "Informational":
		return 3
	default:
		return 4
	}
}
