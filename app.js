var express = require('express'),
    bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var swig = require('swig');

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/templates');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var rooms = {};

app.get('/', function (req, res) {
    res.render('index');
});

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    console.log('New connection from ' + clientIp);

    socket.on('joinRoom', function (roomname) {
        var room = rooms[roomname];
        if (!room) {
            socket.emit('joinRoom', {ret: 0, err: 'no such room'});
        } else {
            socket.roomname = roomname;
            socket.role = 'challenger';
            room.challenger = socket;
            var RandomSeed = Math.random();
            room.master.emit("start", {role: "master", seed: RandomSeed});
            room.challenger.emit("start", {role: "challenger", seed: RandomSeed} )
        }

    });
    socket.on('getRooms', function(data) {
        var msg = {'ret': 1, 'data': Object.keys(rooms)};
        socket.emit('getRooms', msg);
    });
    socket.on('newRoom', function(data) {
        var roomname = data['name'];
        var msg;
        if (roomname in rooms) {
            msg = {'ret': 0, 'err': 'room already existed'}
        } else {
            rooms[roomname] = {master: socket, challenger: null, winner: null};
            msg = {'ret': 1};
            socket.roomname = roomname;
            socket.role = 'master';
        }
        socket.emit('newRooms', msg);
    });
    socket.on('KeyUp', function (data) {
        var room = rooms[socket.roomname];
        if(room){
            if (socket.role === 'master') {
                room.challenger.emit("KU", data);
            } else {
                room.master.emit("KU", data);
            }
        }
    });
    socket.on('KeyDown', function (data) {
        var room = rooms[socket.roomname];
        if (room) {
            if (socket.role === 'master') {
                room.challenger.emit("KD", data);
            } else {
                room.master.emit("KD", data);
            }
        }
    });
    socket.on('end', function (data) {
        var room = rooms[socket.roomname];
        var winner = data;
        if (room.winner == null ) {
            room.winner = winner;
        } else if (room.winner != winner) {
            socket.emit('end', {ret: 0, err: "result don't match"})
        } else {
            room.master.emit('end', {ret: 1, data: winner});
            room.challenger.emit('end', {ret: 1, data: winner});
            delete rooms[socket.roomname];
        }
    });
    socket.on('disconnect', function(){
        var room = rooms[socket.roomname];
        if (room) {
            var other = (room.challenger == socket)?room.master:room.challenger;
            other.emit('err', "Other Player Disconnected!");
        }
    })

});

server.listen(4000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
