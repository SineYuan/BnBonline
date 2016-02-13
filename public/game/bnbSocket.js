if (!window.WebSocket) {   
    alert("WebSocket not supported by this browser!");   
}

var player1, player2;
var websocket;
var NetManage = {};

NetManage.StartWebSocket = function(){
    websocket = new WebSocket("ws://127.0.0.1:2000");

    websocket.onmessage = function(evt) {
        HandleMessage(evt);
    };
      
    websocket.onclose = function() {
        ShowAlert("连接已关闭。");
        ws = null;
    };
      
    websocket.onerror = function(evt){
        ShowAlert("连接出错:"+evt.data);
        ws = null;
    }

    websocket.onopen = function(evt) {
        ShowAlert("连接已打开。");
    };
}

NetManage.SendMessage = function(message){
    if(websocket != null){
        if(message.length > 0){
            websocket.send(message);
        }
    }
    else{
        ShowAlert('WebSocket未连接或连接失败!');
    }
}

function ShowAlert(message){
    document.getElementById("tips").innerHTML = message;
}

//处理服务器返回的消息
function HandleMessage(evt){
    var m = evt.data.split(":")[0];
    switch(m){
        case "createusersuccess":
            CreateUserSuccess();
            break;
        case "createuserfailed":
            CreateUserFailed();
            break;
        case "createroomsuccess":
            CreateRoomSuccess();
            break;
        case "createroomfailed":
            CreateRoomFailed();
            break;
        case "JoinSuccess":
            JoinSuccess();
            break;
        case "Joinfailed":
            JoinFailed();
            break;
        case "roomslist":
            ShowRooms(eval(evt.data.substr(10)));
            break;
        case "gamestart":
            LoadGame();
            break;
        case "Start":
            GameStart(parseInt(evt.data.substr(6)));
            break;
        case "Action":
            DoAction(eval("(" + evt.data.substr(7) + ")"));
            break;
        case "giftmap":
            CreateGift(eval("(" + evt.data.substr(8) + ")"));
            break;
    }
}

//载入游戏
function LoadGame(){
    InitGame();
}

//游戏初始化
function GameStart(position){
    player1 = CreateRole(1, 0, 0);
    player2 = CreateRole(2, 14, 12);
    if(position == 1){
        CreateUserEvent(player1);
    }
    else{
        CreateUserEvent(player2);
    }
}

//玩家操作
function DoAction(action){
    //console.log(action);
    var role = action.User == 1 ? player1 : player2;
    switch(action.action.Type){
        case "stop":
            role.Direction = action.action.Direct;
            role.SetPosition(action.action.Position.X, action.action.Position.Y);
            RoleKeyEventEnd(action.action.Key, role);
            break;
        case "move":
            RoleKeyEvent(action.action.Key, role);
            break;
    }
}

//生成宝物
function CreateGift(data){
    console.log(data);
    GiftStorage = data;
}

//创建用户成功
function CreateUserSuccess(){
    ShowAlert("创建用户成功");
}

//创建用户失败
function CreateUserFailed(){
    ShowAlert("创建用户失败");
}

//创建房间成功
function CreateRoomSuccess(){
    ShowAlert("创建房间成功");
    
}

//创建房间失败
function CreateRoomFailed(){
    ShowAlert("创建房间失败");
}

//加入房间成功
function JoinSuccess(){
    ShowAlert("加入房间成功");    
}

//加入房间失败
function JoinFailed(){
    ShowAlert("加入房间失败");
}

//显示Rooms信息
function ShowRooms(obj){
    var list = "<ul>";
    for(var i=0; i<obj.length; i++){
        list += "<li onclick=\"JoinRoom('" + obj[i].ID + "')\">" + obj[i].Name + "  (" + obj[i].ID + ")" + "</li>";
    }
    list += "</ul>";
    document.getElementById("roomslist").innerHTML = list;
}

//加入房间
function JoinRoom(roomid){
    NetManage.SendMessage("joinroom:" + roomid);
}