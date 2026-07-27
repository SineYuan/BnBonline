package main

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

// message is the wire format shared with the tiny client shim in
// public/socketio.js: {"event": "...", "data": ...}
type message struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data,omitempty"`
}

// client represents one connected browser tab (one WebSocket connection).
type client struct {
	conn     *websocket.Conn
	send     chan message
	roomName string
	role     string // "master" or "challenger"
}

func newClient(conn *websocket.Conn) *client {
	c := &client{conn: conn, send: make(chan message, 16)}
	go c.writePump()
	return c
}

// emitJSON marshals v and queues it for delivery under the given event name.
func (c *client) emitJSON(event string, v interface{}) {
	raw, err := json.Marshal(v)
	if err != nil {
		log.Println("emitJSON marshal error:", err)
		return
	}
	c.emitRaw(event, raw)
}

// emitRaw queues an already-encoded JSON payload for delivery.
func (c *client) emitRaw(event string, raw json.RawMessage) {
	select {
	case c.send <- message{Event: event, Data: raw}:
	default:
		log.Println("client send buffer full, dropping event", event)
	}
}

func (c *client) writePump() {
	for msg := range c.send {
		if err := c.conn.WriteJSON(msg); err != nil {
			return
		}
	}
}

func (c *client) close() {
	close(c.send)
	c.conn.Close()
}

// readPump reads events from the browser until the connection closes.
func (c *client) readPump(h *hub) {
	defer func() {
		h.handleDisconnect(c)
		c.close()
	}()

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			return
		}

		var msg message
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}

		switch msg.Event {
		case "getRooms":
			h.handleGetRooms(c)
		case "newRoom":
			var payload struct {
				Name string `json:"name"`
			}
			json.Unmarshal(msg.Data, &payload)
			h.handleNewRoom(c, payload.Name)
		case "joinRoom":
			var name string
			json.Unmarshal(msg.Data, &name)
			h.handleJoinRoom(c, name)
		case "KeyUp":
			h.relayKey(c, "KU", msg.Data)
		case "KeyDown":
			h.relayKey(c, "KD", msg.Data)
		case "end":
			var winner string
			json.Unmarshal(msg.Data, &winner)
			h.handleEnd(c, winner)
		}
	}
}
