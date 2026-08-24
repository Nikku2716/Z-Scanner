package api

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type wsMessage struct {
	Type string          `json:"type"`
	Scan *scan.Scan      `json:"scan,omitempty"`
	Log  *scan.LogEntry  `json:"log,omitempty"`
	Logs []scan.LogEntry `json:"logs,omitempty"`
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*websocket.Conn]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*websocket.Conn]struct{})}
}

func (h *Hub) Run() {}

func (h *Hub) register(scanID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[scanID] == nil {
		h.clients[scanID] = make(map[*websocket.Conn]struct{})
	}
	h.clients[scanID][conn] = struct{}{}
}

func (h *Hub) unregister(scanID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conns, ok := h.clients[scanID]; ok {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.clients, scanID)
		}
	}
}

func (h *Hub) broadcast(scanID string, msg wsMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	conns := h.clients[scanID]
	h.mu.RUnlock()
	for conn := range conns {
		_ = conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (s *Server) scanWebSocket(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	s.hub.register(id, conn)
	defer s.hub.unregister(id, conn)

	// Send current state and logs
	if current, err := s.orch.Get(id); err == nil {
		s.hub.broadcast(id, wsMessage{Type: "scan", Scan: current})
	}
	logs := s.orch.GetLogs(id)
	if len(logs) > 0 {
		_ = conn.WriteJSON(wsMessage{Type: "logs", Logs: logs})
	}

	unsub := func(sc *scan.Scan, entry scan.LogEntry) {
		s.hub.broadcast(id, wsMessage{Type: "log", Scan: sc, Log: &entry})
	}
	s.orch.Subscribe(id, unsub)
	defer func() {
		// subscription persists for scan lifetime; acceptable for MVP
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
