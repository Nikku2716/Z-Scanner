package scan

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ghost0/BlackHawk/backend/internal/zapclient"
)

type ProgressCallback func(*Scan, LogEntry)

type Orchestrator struct {
	zap     *zapclient.Client
	store   *Store
	mu      sync.RWMutex
	active  map[string]context.CancelFunc
	notify  map[string][]ProgressCallback
	logs    map[string][]LogEntry
}

func NewOrchestrator(zap *zapclient.Client, store *Store) *Orchestrator {
	return &Orchestrator{
		zap:    zap,
		store:  store,
		active: make(map[string]context.CancelFunc),
		notify: make(map[string][]ProgressCallback),
		logs:   make(map[string][]LogEntry),
	}
}

func (o *Orchestrator) Subscribe(id string, cb ProgressCallback) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.notify[id] = append(o.notify[id], cb)
}

func (o *Orchestrator) GetLogs(id string) []LogEntry {
	o.mu.RLock()
	defer o.mu.RUnlock()
	return append([]LogEntry(nil), o.logs[id]...)
}

func (o *Orchestrator) Start(target string, cfg ScanConfig) (*Scan, error) {
	if cfg.MaxChildren == 0 {
		cfg = DefaultConfig(cfg.Mode)
	}

	scan := &Scan{
		ID:     uuid.New().String(),
		Target: target,
		Config: cfg,
		Status: StatusPending,
		Progress: Progress{
			Phase:   "initializing",
			Message: "Starting scan",
		},
		Alerts:    []Alert{},
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if err := o.store.Save(scan); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithCancel(context.Background())
	o.mu.Lock()
	o.active[scan.ID] = cancel
	o.logs[scan.ID] = nil
	o.mu.Unlock()

	go o.run(ctx, scan)
	return scan, nil
}

func (o *Orchestrator) Stop(id string) error {
	o.mu.Lock()
	cancel, ok := o.active[id]
	o.mu.Unlock()
	if !ok {
		return fmt.Errorf("scan not running: %s", id)
	}
	cancel()
	return nil
}

func (o *Orchestrator) Get(id string) (*Scan, error) {
	return o.store.Get(id)
}

func (o *Orchestrator) Delete(id string) error {
	o.mu.Lock()
	cancel, running := o.active[id]
	delete(o.active, id)
	delete(o.logs, id)
	o.mu.Unlock()
	if running {
		cancel()
	}
	return o.store.Delete(id)
}

func (o *Orchestrator) List() ([]Scan, error) {
	return o.store.List()
}

func (o *Orchestrator) run(ctx context.Context, scan *Scan) {
	defer func() {
		o.mu.Lock()
		delete(o.active, scan.ID)
		o.mu.Unlock()
	}()

	o.update(scan, StatusRunning, Progress{Phase: "init", Message: "Connecting to ZAP"}, "info", "Connecting to ZAP daemon")

	if err := o.zap.WaitForReady(30); err != nil {
		o.fail(scan, err)
		return
	}

	sessionName := fmt.Sprintf("blackhawk-%s", scan.ID[:8])
	if err := o.zap.NewSession(sessionName); err != nil {
		o.fail(scan, err)
		return
	}
	o.log(scan, "info", "Created new ZAP session")

	if err := o.zap.AccessURL(scan.Target); err != nil {
		o.fail(scan, fmt.Errorf("access target: %w", err))
		return
	}
	o.log(scan, "info", fmt.Sprintf("Accessed target: %s", scan.Target))

	// Spider phase
	o.update(scan, StatusRunning, Progress{Phase: "spider", Message: "Spidering target"}, "info", "Starting spider scan")
	spiderID, err := o.zap.StartSpider(scan.Target, scan.Config.MaxChildren)
	if err != nil {
		o.fail(scan, fmt.Errorf("spider start: %w", err))
		return
	}

	for {
		if ctx.Err() != nil {
			_ = o.zap.StopSpider(spiderID)
			o.update(scan, StatusStopped, scan.Progress, "warn", "Scan stopped by user")
			return
		}

		pct, err := o.zap.SpiderStatus(spiderID)
		if err != nil {
			o.fail(scan, fmt.Errorf("spider status: %w", err))
			return
		}

		scan.Progress = Progress{
			Phase:         "spider",
			SpiderPercent: pct,
			Message:       fmt.Sprintf("Spidering: %d%%", pct),
		}
		o.persist(scan)
		o.broadcast(scan, LogEntry{Timestamp: time.Now().UTC(), Level: "info", Message: scan.Progress.Message})

		if pct >= 100 {
			break
		}
		time.Sleep(2 * time.Second)
	}
	o.log(scan, "info", "Spider scan complete")

	// Passive scan wait
	o.update(scan, StatusRunning, Progress{Phase: "passive", SpiderPercent: 100, Message: "Waiting for passive scan"}, "info", "Processing passive scan queue")
	for i := 0; i < 30; i++ {
		if ctx.Err() != nil {
			o.update(scan, StatusStopped, scan.Progress, "warn", "Scan stopped by user")
			return
		}
		remaining, _ := o.zap.PassiveRecordsToScan()
		scan.Progress.PassiveQueue = remaining
		scan.Progress.Message = fmt.Sprintf("Passive scan: %d records remaining", remaining)
		o.persist(scan)
		if remaining == 0 {
			break
		}
		time.Sleep(2 * time.Second)
	}
	o.log(scan, "info", "Passive scan complete")

	// Active scan phase
	o.update(scan, StatusRunning, Progress{Phase: "active", SpiderPercent: 100, Message: "Starting active scan"}, "info", "Starting active vulnerability scan")
	activeID, err := o.zap.StartActiveScan(scan.Target)
	if err != nil {
		o.fail(scan, fmt.Errorf("active scan start: %w", err))
		return
	}

	for {
		if ctx.Err() != nil {
			_ = o.zap.StopActiveScan(activeID)
			o.update(scan, StatusStopped, scan.Progress, "warn", "Scan stopped by user")
			return
		}

		pct, err := o.zap.ActiveScanStatus(activeID)
		if err != nil {
			o.fail(scan, fmt.Errorf("active scan status: %w", err))
			return
		}

		scan.Progress = Progress{
			Phase:         "active",
			SpiderPercent: 100,
			ActivePercent: pct,
			Message:       fmt.Sprintf("Active scan: %d%%", pct),
		}
		o.persist(scan)
		o.broadcast(scan, LogEntry{Timestamp: time.Now().UTC(), Level: "info", Message: scan.Progress.Message})

		if pct >= 100 {
			break
		}
		time.Sleep(3 * time.Second)
	}
	o.log(scan, "info", "Active scan complete")

	zapAlerts, err := o.fetchFinalAlerts(scan.Target)
	if err != nil {
		o.fail(scan, fmt.Errorf("fetch alerts: %w", err))
		return
	}

	scan.Alerts = make([]Alert, 0, len(zapAlerts))
	for _, a := range zapAlerts {
		scan.Alerts = append(scan.Alerts, Alert{
			ID:          uuid.New().String(),
			PluginID:    a.PluginID,
			Name:        a.Name,
			Risk:        a.Risk,
			Confidence:  a.Confidence,
			URL:         a.URL,
			Method:      a.Method,
			Param:       a.Param,
			Attack:      a.Attack,
			Evidence:    a.Evidence,
			Description: a.Description,
			Solution:    a.Solution,
			Reference:   a.Reference,
			CWEID:       a.CWEID,
		})
	}
	scan.Alerts = DeduplicateAlerts(scan.Alerts)

	scan.Status = StatusComplete
	scan.Progress = Progress{
		Phase:         "complete",
		SpiderPercent: 100,
		ActivePercent: 100,
		Message:       fmt.Sprintf("Scan complete — %d alerts found", len(scan.Alerts)),
	}
	scan.UpdatedAt = time.Now().UTC()
	o.persist(scan)
	o.log(scan, "success", scan.Progress.Message)
}

func (o *Orchestrator) fetchFinalAlerts(target string) ([]zapclient.ZAPAlert, error) {
	// Fetch alerts once, after spidering, passive scanning, and active scanning
	// have all finished. Polling phases update progress only; they do not append
	// partial alert snapshots that could later duplicate the final report.
	return o.zap.GetAlerts(target)
}

func (o *Orchestrator) update(scan *Scan, status Status, progress Progress, level, msg string) {
	scan.Status = status
	scan.Progress = progress
	scan.UpdatedAt = time.Now().UTC()
	o.persist(scan)
	o.log(scan, level, msg)
}

func (o *Orchestrator) fail(scan *Scan, err error) {
	scan.Status = StatusFailed
	scan.Error = err.Error()
	scan.Progress.Message = "Scan failed"
	scan.UpdatedAt = time.Now().UTC()
	o.persist(scan)
	o.log(scan, "error", err.Error())
}

func (o *Orchestrator) persist(scan *Scan) {
	_ = o.store.Save(scan)
}

func (o *Orchestrator) log(scan *Scan, level, msg string) {
	entry := LogEntry{Timestamp: time.Now().UTC(), Level: level, Message: msg}
	o.mu.Lock()
	o.logs[scan.ID] = append(o.logs[scan.ID], entry)
	o.mu.Unlock()
	o.broadcast(scan, entry)
}

func (o *Orchestrator) broadcast(scan *Scan, entry LogEntry) {
	o.mu.RLock()
	callbacks := append([]ProgressCallback(nil), o.notify[scan.ID]...)
	o.mu.RUnlock()
	for _, cb := range callbacks {
		cb(scan, entry)
	}
}
