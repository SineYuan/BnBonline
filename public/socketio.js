/**
 * Minimal socket.io-compatible shim backed by a plain WebSocket, talking to
 * the Go server's /ws endpoint. It only implements the tiny subset of the
 * socket.io client API this game actually uses: io(), socket.on(event, cb)
 * and socket.emit(event, data).
 *
 * Wire format: {"event": "...", "data": ...} JSON frames, one per message.
 */
function io() {
    var scheme = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    var ws = new WebSocket(scheme + location.host + '/ws');

    var handlers = {};
    var queue = [];
    var isOpen = false;

    function trigger(event, data) {
        var cbs = handlers[event];
        if (!cbs) return;
        for (var i = 0; i < cbs.length; i++) {
            cbs[i](data);
        }
    }

    ws.onopen = function () {
        isOpen = true;
        for (var i = 0; i < queue.length; i++) {
            ws.send(queue[i]);
        }
        queue = [];
        trigger('connect');
    };

    ws.onmessage = function (evt) {
        var msg;
        try {
            msg = JSON.parse(evt.data);
        } catch (e) {
            return;
        }
        if (msg && msg.event) {
            trigger(msg.event, msg.data);
        }
    };

    ws.onclose = function () {
        isOpen = false;
        trigger('disconnect');
    };

    ws.onerror = function (evt) {
        trigger('connect_error', evt);
    };

    return {
        on: function (event, cb) {
            (handlers[event] = handlers[event] || []).push(cb);
        },
        emit: function (event, data) {
            var payload = JSON.stringify({ event: event, data: data });
            if (isOpen) {
                ws.send(payload);
            } else {
                queue.push(payload);
            }
        }
    };
}
