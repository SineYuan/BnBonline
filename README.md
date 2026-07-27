# BnBonline
H5泡泡堂在线对战版，前端修改自[https://github.com/Visolleon/bnb](https://github.com/Visolleon/bnb)。服务端现有两套实现，二选一运行即可，前端（`public/`、`templates/`）完全复用：

## Go 服务端（标准库 net/http + gorilla/websocket，端口 4000）

    go build -o bnbserver .
    ./bnbserver

浏览器访问[http://127.0.0.1:4000](http://127.0.0.1:4000)进行游戏。

## Rust 服务端（axum + tokio + tower-http，端口 4001）

    cargo run

浏览器访问[http://127.0.0.1:4001](http://127.0.0.1:4001)进行游戏。默认端口 4001，避免和 Go 版本冲突，可用 `PORT` 环境变量覆盖。

## Issues

网络延迟会导致双方游戏不同步
