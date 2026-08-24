package scan

// Store extensions for endpoint persistence live here to keep store.go
// focused on the core scan table.

import (
	"encoding/json"
	"fmt"
	"time"
)

const endpointsSchema = `
	CREATE TABLE IF NOT EXISTS endpoints (
		id TEXT PRIMARY KEY,
		scan_id TEXT NOT NULL,
		url TEXT NOT NULL,
		path TEXT NOT NULL,
		method TEXT NOT NULL,
		status_code INTEGER NOT NULL DEFAULT 0,
		content_type TEXT NOT NULL DEFAULT '',
		params_json TEXT NOT NULL DEFAULT '[]',
		risk_counts_json TEXT NOT NULL DEFAULT '{}',
		metadata_json TEXT NOT NULL DEFAULT '{}',
		discovered_at TEXT NOT NULL,
		UNIQUE(scan_id, url, method)
	);
	CREATE INDEX IF NOT EXISTS idx_endpoints_scan ON endpoints(scan_id);
`

func (s *Store) migrateEndpoints() error {
	_, err := s.db.Exec(endpointsSchema)
	return err
}

// ReplaceScanEndpoints atomically replaces the stored endpoint set for a
// scan. Called once per completed collection pass.
func (s *Store) ReplaceScanEndpoints(scanID string, endpoints []Endpoint) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.Exec(`DELETE FROM endpoints WHERE scan_id = ?`, scanID); err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	for i := range endpoints {
		e := endpoints[i]
		if e.ID == "" {
			prefix := scanID
			if len(prefix) > 8 {
				prefix = prefix[:8]
			}
			e.ID = fmt.Sprintf("%s-ep-%04d", prefix, i+1)
		}
		e.ScanID = scanID
		e.DiscoveredAt, _ = time.Parse(time.RFC3339, now)
		paramsJSON, _ := json.Marshal(e.Params)
		riskJSON, _ := json.Marshal(e.RiskCounts)
		metaJSON, _ := json.Marshal(e.Metadata)

		if _, err := tx.Exec(`
			INSERT INTO endpoints (id, scan_id, url, path, method, status_code, content_type, params_json, risk_counts_json, metadata_json, discovered_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(scan_id, url, method) DO UPDATE SET
				status_code = excluded.status_code,
				content_type = excluded.content_type,
				params_json = excluded.params_json,
				risk_counts_json = excluded.risk_counts_json,
				discovered_at = excluded.discovered_at
		`, e.ID, e.ScanID, e.URL, e.Path, e.Method, e.StatusCode, e.ContentType,
			string(paramsJSON), string(riskJSON), string(metaJSON), now); err != nil {
			return fmt.Errorf("insert endpoint %s: %w", e.URL, err)
		}
		endpoints[i] = e
	}
	return tx.Commit()
}

// ListScanEndpoints returns all persisted endpoints for a scan.
func (s *Store) ListScanEndpoints(scanID string) ([]Endpoint, error) {
	rows, err := s.db.Query(`
		SELECT id, scan_id, url, path, method, status_code, content_type, params_json, risk_counts_json, metadata_json, discovered_at
		FROM endpoints WHERE scan_id = ? ORDER BY method, url
	`, scanID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	endpoints := []Endpoint{}
	for rows.Next() {
		var e Endpoint
		var paramsJSON, riskJSON, metaJSON, discoveredAt string
		if err := rows.Scan(&e.ID, &e.ScanID, &e.URL, &e.Path, &e.Method, &e.StatusCode,
			&e.ContentType, &paramsJSON, &riskJSON, &metaJSON, &discoveredAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(paramsJSON), &e.Params)
		_ = json.Unmarshal([]byte(riskJSON), &e.RiskCounts)
		_ = json.Unmarshal([]byte(metaJSON), &e.Metadata)
		e.DiscoveredAt, _ = time.Parse(time.RFC3339, discoveredAt)
		endpoints = append(endpoints, e)
	}
	return endpoints, rows.Err()
}

// DeleteScanEndpoints removes endpoint records when a scan is deleted.
func (s *Store) DeleteScanEndpoints(scanID string) error {
	_, err := s.db.Exec(`DELETE FROM endpoints WHERE scan_id = ?`, scanID)
	return err
}
