mod hub;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use hub::{next_client_id, ClientHandle, Hub, InMessage, Role};
use std::net::SocketAddr;
use tokio::sync::mpsc;
use tower_http::services::{ServeDir, ServeFile};

// Both the Go and Rust servers reuse the very same frontend, so these paths
// point at the shared public/ and templates/ directories at the repo root
// (this crate's Cargo.toml lives at the repo root too), rather than
// duplicating any frontend assets.
const PUBLIC_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/public");
const INDEX_HTML: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/templates/index.html");

// Distinct default port from the Go server (:4000) so both can run side by
// side for comparison; override with the PORT env var if needed.
const DEFAULT_PORT: u16 = 4001;

#[tokio::main]
async fn main() {
    let hub = Hub::new();

    let app = Router::new()
        .route_service("/", ServeFile::new(INDEX_HTML))
        .route("/ws", get(ws_handler))
        .fallback_service(ServeDir::new(PUBLIC_DIR))
        .with_state(hub);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(DEFAULT_PORT);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    println!("App listening at http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind listener");
    axum::serve(listener, app).await.expect("server error");
}

async fn ws_handler(ws: WebSocketUpgrade, State(hub): State<Hub>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, hub))
}

/// One task per connection: a lightweight writer loop drains `rx` into the
/// real WebSocket sink, while this function's own loop reads incoming
/// messages and dispatches them to the hub. `room_name`/`role` are local
/// mutable state for this connection only (Master or Challenger, set once a
/// newRoom/joinRoom call succeeds), matching the fields on Go's `client`
/// struct.
async fn handle_socket(socket: WebSocket, hub: Hub) {
    let (mut ws_tx, mut ws_rx) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    let writer = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_tx.send(msg).await.is_err() {
                break;
            }
        }
    });

    let client = ClientHandle::new(next_client_id(), tx);
    let mut room_name = String::new();
    let mut role: Option<Role> = None;

    while let Some(Ok(msg)) = ws_rx.next().await {
        let Message::Text(text) = msg else {
            continue;
        };
        let Ok(parsed) = serde_json::from_str::<InMessage>(&text) else {
            continue;
        };

        match parsed.event.as_str() {
            "getRooms" => hub.get_rooms(&client).await,
            "newRoom" => {
                let name = parsed
                    .data
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                if let Some(created) = hub.new_room(&client, name).await {
                    room_name = created;
                    role = Some(Role::Master);
                }
            }
            "joinRoom" => {
                let name = parsed.data.as_str().unwrap_or("").to_string();
                if hub.join_room(&client, &name).await {
                    room_name = name;
                    role = Some(Role::Challenger);
                }
            }
            "KeyUp" => {
                if let Some(r) = role {
                    hub.relay_key(&room_name, r, "KU", parsed.data).await;
                }
            }
            "KeyDown" => {
                if let Some(r) = role {
                    hub.relay_key(&room_name, r, "KD", parsed.data).await;
                }
            }
            "end" => {
                let winner = parsed.data.as_str().unwrap_or("").to_string();
                hub.end(&client, &room_name, winner).await;
            }
            _ => {}
        }
    }

    hub.disconnect(client.id, &room_name).await;
    writer.abort();
}
