
var backgroundMusic;
var resPrefix = 'game/';
var gameRunning;

function InitGame(){
    var game = new Game(800, 600);
    game.ExceptFPS = 60;
    //游戏背景
    var background = new Bitmap(resPrefix + 'Pic/BG.png');
    background.ZIndex = 0;

    //背景音乐
    SystemSound.Play(SoundType.Start, false);

    setTimeout(function () {
        backgroundMusic = SystemSound.Play(SoundType.Background, true);
    }, 300);

    //时间显示
    var timesecondsCount = 0;
    var timetenMinutes = new Bitmap(resPrefix + "Pic/Number.png");
    timetenMinutes.Size = new Size(12, 10);
    timetenMinutes.Position = new Point(708, 43);

    var timenumberMinutes = new Bitmap(resPrefix + "Pic/Number.png");
    timenumberMinutes.Size = new Size(12, 10);
    timenumberMinutes.Position = new Point(720, 43);

    var timetenSeconds = new Bitmap(resPrefix + "Pic/Number.png");
    timetenSeconds.Size = new Size(12, 10);
    timetenSeconds.Position = new Point(742, 43);

    var timenumberSeconds = new Bitmap(resPrefix + "Pic/Number.png");
    timenumberSeconds.Size = new Size(12, 10);
    timenumberSeconds.Position = new Point(754, 43);

    var timeControlInterval = new Thread(function() {
        timesecondsCount++;

        var minutestemp = parseInt(timesecondsCount / 60, 10) % 60;
        timetenMinutes.StartPoint = new Point(parseInt(minutestemp / 10, 10) * 12, 0);
        timenumberMinutes.StartPoint = new Point((minutestemp % 10) * 12, 0);

        var secondstemp = timesecondsCount % 60;
        timetenSeconds.StartPoint = new Point(parseInt(secondstemp / 10, 10) * 12, 0);
        timenumberSeconds.StartPoint = new Point((secondstemp % 10) * 12, 0);

    }, 1000).Start();


    //文字显示
    var fpsText = new Label("FPS: " + game.FPS);
    fpsText.Position = new Point(700, 20);
    fpsText.Color = "White";

    //显示FPS
    new Thread(function() {
        fpsText.Text = 'FPS: ' + game.FPS;
    }, 500).Start();

    //游戏开始
    game.Start();
    DrawGameBackground();
    DrawBarrierMap();
    gameRunning = true;
}

function CreateRole(number, x, y){
    //任务角色
    var role1 = new Role(number);
    if(number == 1){
        role1.AniSize = new Size(48, 64);
        role1.DieSize = new Size(48, 100);
        role1.Offset = new Size(0, 12);
        role1.RideSize = new Size(48, 56);
        role1.Object.Size = new Size(48, 64);
    }
    else{
        role1.Offset = new Size(0, 17);
        role1.RideSize = new Size(56, 60);
        role1.Offset = new Size(0, 17);
        role1.Object.Size = new Size(56, 67);
        role1.AniSize = new Size(56, 70);
        role1.DieSize = new Size(56, 98);
    }
    role1.SetRawSpeed(4);
    role1.PaopaoStrong = 2;
    role1.CanPaopaoLength = 2;
    role1.SetToMap(x, y);

    role1.isKeyup = false;
    role1.currentKeyCode = 0;
    return role1;
}

var isKeyup = false;
var currentKeyCode = 0;

function CreateUserEvent(role, socket){
    //按键事件
    document.addEventListener("keydown", RoleEvent, true);
    document.addEventListener("keyup", RoleEventEnd, true);

    function RoleEvent(e) {
        if (gameRunning) {
            var key = window.event ? e.keyCode : e.which;
        
            if(key in {87 : 'W', 65 : 'A', 83 : 'S', 68 : 'D', 74 : 'J'}){
                RoleKeyEvent(key, role);
            }
            socket.emit("KeyUp", key);
        }
    }

    //KeyPress结束事件
    function RoleEventEnd(e) {
        if (gameRunning) {
            var key = window.event ? e.keyCode : e.which;
            var centerpoint = role.MapPoint();
            RoleKeyEventEnd(key, role);
            socket.emit("KeyDown", key);
        }
    }
}

function RoleKeyEventEnd(key, role) {
    if (key == role.currentKeyCode) {
        role.isKeyup = false;
        role.Stop();
    }
}

function RoleKeyEvent(key, role) {
    if(key in {87 : 'W', 65 : 'A', 83 : 'S', 68 : 'D'}){
        //另一个键按下后
        if (key != role.currentKeyCode) {
            role.isKeyup = false;
            role.Stop();
        }
        if (!role.isKeyup) {
            role.currentKeyCode = key;
            role.isKeyup = true;
            
            switch (key) {
                //W键,向上移动     
                case 87:
                    role.Move(Direction.Up);
                    break;
                //A键,向左移动
                case 65:
                    role.Move(Direction.Left);
                    break;
                    //S键,向下移动
                case 83:
                    role.Move(Direction.Down);
                    break;
                //D键,向右移动
                case 68:
                    role.Move(Direction.Right);
                    break;
            }
        }
    }
    //J键
    //空格键：32
    else if(key == 74){
        role.PaoPao();
    }
}