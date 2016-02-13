InitGame();
var player1 = CreateRole(1, 0, 0);
var player2 = CreateRole(2, 14, 12);
CreateUserEvent(player1, socket);

socket.on('KU', function(data){
    var key = parseInt(data);
    console.log("KU " + key);
    if (player2 && key) {
        console.log("call RoleKeyEvent");
        console.log(player2);
        RoleKeyEvent(key, player2);
    }

});
socket.on('KD', function(data){
    var key = parseInt(data);
    console.log("KD " + key);
    if (player2 && key) {
        console.log("call RoleKeyEventEnd");
        console.log(player2);
        RoleKeyEventEnd(key, player2);
    }
});