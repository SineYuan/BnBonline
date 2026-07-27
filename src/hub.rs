use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use axum::extract::ws::Message;
use serde::Deserialize;
use serde_json::json;
use tokio::sync::{mpsc, Mutex};

/// Bounds room names coming from the client (mirrors the length limit that
/// should also be enforced/escaped on the client).
pub const MAX_ROOM_NAME_LEN: usize = 40;

static NEXT_CLIENT_ID: AtomicU64 = AtomicU64::new(1);

pub fn next_client_id() -> u64 {
    NEXT_CLIENT_ID.fetch_add(1, Ordering::Relaxed)
}

/// The wire format shared with the browser shim in public/socketio.js:
/// {"event": "...", "data": ...}
#[derive(Deserialize)]
pub struct InMessage {
    pub event: String,
    #[serde(default)]
    pub data: serde_json::Value,
}

/// A handle to one connected browser tab (one WebSocket connection). Cheap to
/// clone: it's just an id plus a channel sender used to push events to that
/// client's writer task.
#[derive(Clone)]
pub struct ClientHandle {
    pub id: u64,
    tx: mpsc::UnboundedSender<Message>,
}

impl ClientHandle {
    pub fn new(id: u64, tx: mpsc::UnboundedSender<Message>) -> Self {
        Self { id, tx }
    }

    pub fn emit(&self, event: &str, data: serde_json::Value) {
        let payload = json!({ "event": event, "data": data }).to_string();
        // Ignore send errors: the client's writer task/socket is already gone.
        let _ = self.tx.send(Message::Text(payload.into()));
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Master,
    Challenger,
}

/// Mirrors the {master, challenger, winner} object kept in the original
/// app.js `rooms` map.
struct Room {
    master: ClientHandle,
    challenger: Option<ClientHandle>,
    winner: Option<String>,
}

/// Owns the room table and is safe to clone/share across every connection's
/// task.
#[derive(Clone, Default)]
pub struct Hub {
    rooms: Arc<Mutex<HashMap<String, Room>>>,
}

impl Hub {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn get_rooms(&self, client: &ClientHandle) {
        let names: Vec<String> = self.rooms.lock().await.keys().cloned().collect();
        client.emit("getRooms", json!({ "ret": 1, "data": names }));
    }

    /// Returns the room name on success, so the caller can remember it as
    /// this connection's current room.
    pub async fn new_room(&self, client: &ClientHandle, name: &str) -> Option<String> {
        let name = name.trim();
        if name.is_empty() || name.chars().count() > MAX_ROOM_NAME_LEN {
            client.emit("newRooms", json!({ "ret": 0, "err": "invalid room name" }));
            return None;
        }

        let mut rooms = self.rooms.lock().await;
        if rooms.contains_key(name) {
            drop(rooms);
            client.emit("newRooms", json!({ "ret": 0, "err": "room already existed" }));
            return None;
        }
        rooms.insert(
            name.to_string(),
            Room {
                master: client.clone(),
                challenger: None,
                winner: None,
            },
        );
        drop(rooms);

        client.emit("newRooms", json!({ "ret": 1 }));
        Some(name.to_string())
    }

    /// Returns true on success (room existed and the caller became the
    /// challenger), mirroring app.js's socket.on('joinRoom') handler.
    pub async fn join_room(&self, client: &ClientHandle, name: &str) -> bool {
        let mut rooms = self.rooms.lock().await;
        let Some(room) = rooms.get_mut(name) else {
            drop(rooms);
            client.emit("joinRoom", json!({ "ret": 0, "err": "no such room" }));
            return false;
        };

        room.challenger = Some(client.clone());
        let master = room.master.clone();
        drop(rooms);

        let seed: f64 = rand::random();
        master.emit("start", json!({ "role": "master", "seed": seed }));
        client.emit("start", json!({ "role": "challenger", "seed": seed }));
        true
    }

    /// Forwards raw KeyUp/KeyDown payloads untouched to the other player in
    /// the room, exactly like app.js's socket.on('KeyUp'/'KeyDown') handlers.
    pub async fn relay_key(&self, room_name: &str, role: Role, out_event: &str, data: serde_json::Value) {
        let rooms = self.rooms.lock().await;
        let Some(room) = rooms.get(room_name) else {
            return;
        };
        match role {
            Role::Master => {
                if let Some(challenger) = &room.challenger {
                    challenger.emit(out_event, data);
                }
            }
            Role::Challenger => room.master.emit(out_event, data),
        }
    }

    pub async fn end(&self, client: &ClientHandle, room_name: &str, winner: String) {
        let mut rooms = self.rooms.lock().await;
        let Some(room) = rooms.get_mut(room_name) else {
            return;
        };

        if room.winner.is_none() {
            room.winner = Some(winner);
            return;
        }
        if room.winner.as_deref() != Some(winner.as_str()) {
            client.emit("end", json!({ "ret": 0, "err": "result don't match" }));
            return;
        }

        let master = room.master.clone();
        let challenger = room.challenger.clone();
        rooms.remove(room_name);
        drop(rooms);

        master.emit("end", json!({ "ret": 1, "data": winner.clone() }));
        if let Some(challenger) = challenger {
            challenger.emit("end", json!({ "ret": 1, "data": winner }));
        }
    }

    /// Notifies the remaining player and cleans up the room.
    /// (The original Node version never deleted the room here, which leaked
    /// memory forever whenever a player closed the tab mid-match; fixed here,
    /// same as in the Go rewrite.)
    pub async fn disconnect(&self, client_id: u64, room_name: &str) {
        if room_name.is_empty() {
            return;
        }

        let mut rooms = self.rooms.lock().await;
        let Some(room) = rooms.remove(room_name) else {
            return;
        };
        drop(rooms);

        let other = if room.master.id == client_id {
            room.challenger
        } else {
            Some(room.master)
        };
        if let Some(other) = other {
            other.emit("err", json!("Other Player Disconnected!"));
        }
    }
}
