package scan

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func NewStore(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS scans (
			id TEXT PRIMARY KEY,
			target TEXT NOT NULL,
			config_json TEXT NOT NULL,
			status TEXT NOT NULL,
			progress_json TEXT NOT NULL,
			alerts_json TEXT NOT NULL DEFAULT '[]',
			error TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)
	`)
	return err
}

func (s *Store) Save(scan *Scan) error {
	configJSON, _ := json.Marshal(scan.Config)
	progressJSON, _ := json.Marshal(scan.Progress)
	alertsJSON, _ := json.Marshal(DeduplicateAlerts(scan.Alerts))

	_, err := s.db.Exec(`
		INSERT INTO scans (id, target, config_json, status, progress_json, alerts_json, error, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			status = excluded.status,
			progress_json = excluded.progress_json,
			alerts_json = excluded.alerts_json,
			error = excluded.error,
			updated_at = excluded.updated_at
	`, scan.ID, scan.Target, string(configJSON), scan.Status, string(progressJSON),
		string(alertsJSON), scan.Error, scan.CreatedAt.Format(time.RFC3339), scan.UpdatedAt.Format(time.RFC3339))
	return err
}

func (s *Store) Get(id string) (*Scan, error) {
	row := s.db.QueryRow(`
		SELECT id, target, config_json, status, progress_json, alerts_json, error, created_at, updated_at
		FROM scans WHERE id = ?
	`, id)
	return scanFromRow(row)
}

func (s *Store) List() ([]Scan, error) {
	rows, err := s.db.Query(`
		SELECT id, target, config_json, status, progress_json, alerts_json, error, created_at, updated_at
		FROM scans ORDER BY created_at DESC LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scans []Scan
	for rows.Next() {
		scan, err := scanFromRow(rows)
		if err != nil {
			return nil, err
		}
		scans = append(scans, *scan)
	}
	return scans, rows.Err()
}

func (s *Store) Delete(id string) error {
	_, err := s.db.Exec(`DELETE FROM scans WHERE id = ?`, id)
	return err
}

func (s *Store) Close() error {
	return s.db.Close()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanFromRow(row rowScanner) (*Scan, error) {
	var scan Scan
	var configJSON, progressJSON, alertsJSON string
	var createdAt, updatedAt string

	err := row.Scan(&scan.ID, &scan.Target, &configJSON, &scan.Status, &progressJSON,
		&alertsJSON, &scan.Error, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(configJSON), &scan.Config); err != nil {
		return nil, fmt.Errorf("config: %w", err)
	}
	if err := json.Unmarshal([]byte(progressJSON), &scan.Progress); err != nil {
		return nil, fmt.Errorf("progress: %w", err)
	}
	if err := json.Unmarshal([]byte(alertsJSON), &scan.Alerts); err != nil {
		return nil, fmt.Errorf("alerts: %w", err)
	}
	scan.Alerts = DeduplicateAlerts(scan.Alerts)

	scan.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	scan.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	return &scan, nil
}
