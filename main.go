package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

const (
	staticDir  = "public"
	homePage   = "templates/index.html"
	listenAddr = ":4000"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// The original app never restricted cross-origin socket.io connections either.
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	h := newHub()
	fileServer := http.FileServer(http.Dir(staticDir))

	mux := http.NewServeMux()

	// "/" serves the room lobby page; everything else falls through to the
	// public/ static file server, mirroring express.static('public') + the
	// explicit GET '/' route in the original app.js.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, homePage)
			return
		}
		fileServer.ServeHTTP(w, r)
	})

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			return
		}
		log.Println("New connection from", r.RemoteAddr)
		c := newClient(conn)
		c.readPump(h)
	})

	log.Println("App listening at http://0.0.0.0" + listenAddr)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}
