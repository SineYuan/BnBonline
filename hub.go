package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"strings"
	"sync"
)

// maxRoomNameLen bounds room names coming from the client (defence in depth,
// mirrors the length limit that should also be enforced/escaped on the client).
const maxRoomNameLen = 40

// room mirrors the {master, challenger, winner} object kept in the original
// app.js `rooms` map.
type room struct {
	master     *client
	challenger *client
	winner     string
}

// hub owns the room table and is safe for concurrent use by every client's
// read goroutine.
type hub struct {
	mu    sync.Mutex
	rooms map[string]*room
}

func newHub() *hub {
	return &hub{rooms: make(map[string]*room)}
}

func (h *hub) roomNames() []string {
	h.mu.Lock()
	defer h.mu.Unlock()
	names := make([]string, 0, len(h.rooms))
	for name := range h.rooms {
		names = append(names, name)
	}
	return names
}

func (h *hub) handleGetRooms(c *client) {
	c.emitJSON("getRooms", map[string]interface{}{"ret": 1, "data": h.roomNames()})
}

func (h *hub) handleNewRoom(c *client, name string) {
	name = strings.TrimSpace(name)
	if name == "" || len(name) > maxRoomNameLen {
		c.emitJSON("newRooms", map[string]interface{}{"ret": 0, "err": "invalid room name"})
		return
	}

	h.mu.Lock()
	if _, exists := h.rooms[name]; exists {
		h.mu.Unlock()
		c.emitJSON("newRooms", map[string]interface{}{"ret": 0, "err": "room already existed"})
		return
	}
	h.rooms[name] = &room{master: c}
	h.mu.Unlock()

	c.roomName = name
	c.role = "master"
	c.emitJSON("newRooms", map[string]interface{}{"ret": 1})
}

func (h *hub) handleJoinRoom(c *client, name string) {
	h.mu.Lock()
	r, ok := h.rooms[name]
	h.mu.Unlock()

	if !ok {
		c.emitJSON("joinRoom", map[string]interface{}{"ret": 0, "err": "no such room"})
		return
	}

	c.roomName = name
	c.role = "challenger"
	r.challenger = c

	seed := rand.Float64()
	r.master.emitJSON("start", map[string]interface{}{"role": "master", "seed": seed})
	r.challenger.emitJSON("start", map[string]interface{}{"role": "challenger", "seed": seed})
}

// relayKey forwards raw KeyUp/KeyDown payloads untouched to the other player
// in the room, exactly like app.js's socket.on('KeyUp'/'KeyDown') handlers.
func (h *hub) relayKey(c *client, outEvent string, data json.RawMessage) {
	h.mu.Lock()
	r, ok := h.rooms[c.roomName]
	h.mu.Unlock()
	if !ok {
		return
	}
	if c.role == "master" {
		if r.challenger != nil {
			r.challenger.emitRaw(outEvent, data)
		}
	} else {
		if r.master != nil {
			r.master.emitRaw(outEvent, data)
		}
	}
}

func (h *hub) handleEnd(c *client, winner string) {
	h.mu.Lock()
	r, ok := h.rooms[c.roomName]
	h.mu.Unlock()
	if !ok {
		return
	}

	if r.winner == "" {
		r.winner = winner
		return
	}
	if r.winner != winner {
		c.emitJSON("end", map[string]interface{}{"ret": 0, "err": "result don't match"})
		return
	}

	r.master.emitJSON("end", map[string]interface{}{"ret": 1, "data": winner})
	r.challenger.emitJSON("end", map[string]interface{}{"ret": 1, "data": winner})

	h.mu.Lock()
	delete(h.rooms, c.roomName)
	h.mu.Unlock()
}

// handleDisconnect notifies the remaining player and cleans up the room.
// (The original Node version never deleted the room here, which leaked
// memory forever whenever a player closed the tab mid-match; fixed here.)
func (h *hub) handleDisconnect(c *client) {
	if c.roomName == "" {
		return
	}

	h.mu.Lock()
	r, ok := h.rooms[c.roomName]
	if ok {
		delete(h.rooms, c.roomName)
	}
	h.mu.Unlock()
	if !ok {
		return
	}

	var other *client
	if r.challenger == c {
		other = r.master
	} else {
		other = r.challenger
	}
	if other != nil {
		other.emitJSON("err", "Other Player Disconnected!")
	}
}

func logf(format string, args ...interface{}) {
	log.Printf(format, args...)
}
