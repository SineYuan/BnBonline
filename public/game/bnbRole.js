var resPrefix = 'game/';

//物体移动方向枚举
var Direction = {
    Up: 0,
    Down: 1,
    Left: 2,
    Right: 3
}

//角色的属性值
var RoleConstant = {
    MinMoveStep: 2,
    //最大速度
    MaxMoveStep: 8,

    //泡泡最大强度
    MaxPaopaoStrong: 15
}

var RoleStorage = [];

//角色对象
var Role = function(number) {
    this.GUID = "";
    this.RoleNumber = number;
    this.Object = new Bitmap(resPrefix + "Pic/Role" + number + ".png");

    RoleStorage.push(this);
    
    //初始层次
    this.Object.ZIndex = 3;

    //是否死亡
    this.IsDeath = false;

    //偏移
    this.Offset = new Size(0, 0);

    //原始偏移
    this.RawOffset = null;

    //行动方向，默认向下
    this.Direction = Direction.Down;

    //原始速度
    this.RawSpeed = 0;

    //移动速度
    this.MoveStep = 1;

    //坐骑类型
    this.MoveHorse = MoveHorseObject.None;

    //是否可以踢泡泡
    this.IsCanMovePaopao = false;

    //连续可放泡泡次数
    this.CanPaopaoLength = 1;

    //已经放还未爆炸的泡泡数
    this.PaopaoCount = 0;

    //泡泡爆炸强度
    this.PaopaoStrong = 1;

    //是否在泡泡中
    this.IsInPaopao = false;

    //坐骑对象
    this.RideHorseObject = null;

    //坐骑时的大小
    this.RideSize = null;

    //角色原始大小
    this.RawSize = null;

    //AniSize
    this.AniSize = null;

    //Die Size
    this.DieSize = null;

    //设置初始速度
    this.SetRawSpeed = function(speed) {
        this.RawSpeed = speed;
        this.MoveStep = speed;
    }

    //角色坐标重新设置
    this.ResetPosition = function() {
        this.Object.Position.X = this.Object.Position.X - this.Offset.Width;
        this.Object.Position.Y = this.Object.Position.Y - this.Offset.Height;
        //console.log(this.Object.Position.X, this.Object.Position.Y);
    }

    //设置位置坐标，中心坐标，MAP中心内坐标
    this.SetPosition = function(x, y) {
        this.Object.Position = new Point(x + 20 - this.Object.Size.Width / 2 - this.Offset.Width, y + 40 - this.Object.Size.Height / 2 - this.Offset.Height);
    }

    //设置到Map区块
    this.SetToMap = function(x, y) {
        //获取MapID的中心坐标
        var mapx = x * 40 + 20;
        var mapy = y * 40 + 20;
        this.Object.Position = new Point(mapx + 20 - this.Object.Size.Width / 2 - this.Offset.Width, mapy + 40 - this.Object.Size.Height / 2 - this.Offset.Height);
        this.Object.ZIndex = (y + 2) * 2;
    }

    //中心坐标
    this.CenterPoint = function() {
        return new Point(this.Object.Position.X + this.Object.Size.Width / 2 + this.Offset.Width
                            , this.Object.Position.Y + this.Object.Size.Height / 2 + this.Offset.Height);
    }

    //地图的相对坐标
    this.MapPoint = function() {
        var cp = this.CenterPoint();
        return new Point(cp.X - 20, cp.Y - 40);
    }

    //获取当前的MapID
    this.CurrentMapID = function() {
        return FindMapID(this.CenterPoint());
    }

    var animateInterval = 0;
    var moveInterval = 0;

    //角色移动函数
    this.Move = function(directionnum) {
        if (directionnum < 0 || directionnum > 3) return;
        this.Direction = directionnum;
        if (this.RideHorseObject != null) {
            this.RideHorseObject.SetDirection(directionnum);
        }

        var t = this;
        var number = 0;

        if (!this.IsInPaopao) {
            //如果有坐骑
            if (this.MoveHorse != MoveHorseObject.None && this.RideHorseObject != null) {
                this.Object.StartPoint = new Point(this.Object.Size.Width * directionnum, 0);
            }
            else {
                this.Object.StartPoint = new Point(0, this.Object.Size.Height * directionnum);
                //动画线程
                animateInterval = setInterval(function() {
                    if (!t.IsInPaopao) {
                        if (t.MoveHorse != MoveHorseObject.None) {
                            t.Object.StartPoint = new Point(t.Object.Size.Width * directionnum, 0);
                            clearInterval(animateInterval);
                        }
                        else {
                            if (number >= 5) {
                                number = 0;
                            }
                            else {
                                number++;
                            }
                            t.Object.StartPoint = new Point(number * t.Object.Size.Width, t.Object.Size.Height * directionnum);
                        }
                    }
                    else {
                        clearInterval(animateInterval);
                    }
                }, 60);
            }
        }

        //移动线程
        moveInterval = setInterval(function() {
            var roleActualPoint = t.CenterPoint();
            switch (directionnum) {
                case Direction.Up:
                    if (t.IsCanPass(new Point(roleActualPoint.X, roleActualPoint.Y - t.MoveStep - 20))) {
                        t.Object.Position.Y -= t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Down:
                    if (t.IsCanPass(new Point(roleActualPoint.X, roleActualPoint.Y + t.MoveStep + 20))) {
                        t.Object.Position.Y += t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Left:
                    if (t.IsCanPass(new Point(roleActualPoint.X - t.MoveStep - 20, roleActualPoint.Y))) {
                        t.Object.Position.X -= t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Right:
                    if (t.IsCanPass(new Point(roleActualPoint.X + t.MoveStep + 20, roleActualPoint.Y))) {
                        t.Object.Position.X += t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
            }
        }, 20);
    }
    
    //增加移动速度
    this.AddMoveStep = function(addNum) {
        this.MoveStep += addNum;
        if (this.MoveStep > RoleConstant.MaxMoveStep) {
            this.MoveStep = RoleConstant.MaxMoveStep;
        }
    }

    //增加泡泡强度
    this.AddPaopaoStrong = function(addNum) {
        this.PaopaoStrong += addNum;
        if (this.PaopaoStrong > RoleConstant.MaxPaopaoStrong) {
            this.PaopaoStrong = RoleConstant.MaxPaopaoStrong;
        }
    }

    //下一个区块是否可以通过
    this.IsCanMoveNext = function(diretion) {
        var currentMapID = FindMapID(this.CenterPoint());
        var nextmapID = null;
        switch (diretion) {
            case Direction.Up:
                nextmapID = currentMapID.Y - 1;
                break;
            case Direction.Down:
                nextmapID = currentMapID.Y + 1;
                break;
            case Direction.Left:
                nextmapID = currentMapID.X - 1;
                break;
            case Direction.Right:
                nextmapID = currentMapID.X + 1;
                break;
        }
        return nextmapID != null && (townBarrierMap[currentMapID.Y][currentMapID.X] == 0 || townBarrierMap[currentMapID.Y][currentMapID.X] > 100);
    }

    //坐标所属区块是否可以通过
    this.IsCanPass = function(point) {
        //去掉边框的像素
        var nextmap = FindMapID(point);

        //坐标范围
        if (point.X >= 0 && point.Y >= 0 && point.X < 600 && point.Y < 520) {
            var currentMapID = this.CurrentMapID();
            
            if(townBarrierMap[nextmap.Y][nextmap.X] == 100 && currentMapID.X == nextmap.X && currentMapID.Y == nextmap.Y){
                return true;
            }

            var result = false;
            if (this.MoveHorse == MoveHorseObject.UFO) {
                //飞碟可以飞越能炸掉的障碍物
                result = townBarrierMap[nextmap.Y][nextmap.X] <= 0 || townBarrierMap[nextmap.Y][nextmap.X] > 100 || (townBarrierMap[nextmap.Y][nextmap.X] > 0 && townBarrierMap[nextmap.Y][nextmap.X] <= 3);
            }
            else {
                result = townBarrierMap[nextmap.Y][nextmap.X] <= 0 || townBarrierMap[nextmap.Y][nextmap.X] > 100;
            }
            if (result) {
                var zindex = nextmap.Y;
                //zindex += nextmap.X > 0 ? 1 : 0;
                this.Object.ZIndex = zindex * 2 + 2;
                if (this.MoveHorse == MoveHorseObject.UFO) {
                    this.Object.ZIndex += 3;
                }

                if (this.MoveHorse != MoveHorseObject.UFO) {
                    //捡宝物
                    if (townBarrierMap[currentMapID.Y][currentMapID.X] > 100) {
                        SystemSound.Play(SoundType.Get);
                        Barrier.Storage[currentMapID.Y][currentMapID.X].Object.Dispose();

                        //捡宝物后的属性
                        switch (townBarrierMap[currentMapID.Y][currentMapID.X]) {
                            //加泡泡次数                                         
                            case 101:
                                this.CanPaopaoLength++;
                                break;
                            //速度+1                                         
                            case 102:
                                this.AddMoveStep(1);
                                break;
                            //泡泡强度                                         
                            case 103:
                                this.AddPaopaoStrong(1);
                                break;
                            //泡泡强度达到最大                                         
                            case 104:
                                this.AddPaopaoStrong(RoleConstant.MaxPaopaoStrong);
                                break;
                            //速度达到最大                                         
                            case 105:
                                this.MoveStep = RoleConstant.MaxMoveStep;
                                break;
                            //可以踢泡泡                                         
                            case 106:
                                this.IsCanMovePaopao = true;
                                break;
                            //可以乘坐，并移动速度快一点                 
                            case 107:
                                this.MoveStep = this.RawSpeed + 1;
                                this.MoveHorse = MoveHorseObject.Owl;
                                this.Ride();
                                break;
                            //可以乘坐但是移动速度很慢                                         
                            case 108:
                                this.MoveStep = RoleConstant.MinMoveStep;
                                this.MoveHorse = MoveHorseObject.Turtle;
                                this.Ride();
                                break;
                            //可以乘坐並且使移动速度变很快，乘坐后无法捡宝物                                         
                            case 109:
                                this.MoveStep = RoleConstant.MaxMoveStep;
                                this.MoveHorse = MoveHorseObject.UFO;
                                this.Ride();
                                break;
                        }
                        townBarrierMap[currentMapID.Y][currentMapID.X] = 0;
                    }
                }
            }
            return result;
        }
        return false;
    }

    //停止移动
    this.Stop = function() {
        clearInterval(animateInterval);
        clearInterval(moveInterval);
        if (!this.IsInPaopao) {
            if (this.MoveHorse != MoveHorseObject.None) {
                this.Object.StartPoint = new Point(this.Object.Size.Width * this.Direction, 0);
                /*********************解决吃坐骑道具后方向问题*******************/
                //console.log(this.Object.StartPoint.X, this.Object.StartPoint.Y);
            }
            else {
                this.Object.StartPoint = new Point(0, this.Object.Size.Height * this.Direction);
            }
        }
    }

    //对象角色的偏移
    this.RoleOffset = function() {
        var mappoint = this.MapPoint();

        switch (this.Direction) {
            //向上,判断左右区块                                              
            case Direction.Up:
                this.CheckOffset(mappoint, 1, true);
                this.CheckOffset(mappoint, 2, true);
                break;
            case Direction.Down:
                this.CheckOffset(mappoint, 3, true);
                this.CheckOffset(mappoint, 4, true);
                break;
            case Direction.Left:
                this.CheckOffset(mappoint, 1, false);
                this.CheckOffset(mappoint, 3, false);
                break;
            case Direction.Right:
                this.CheckOffset(mappoint, 2, false);
                this.CheckOffset(mappoint, 4, false);
                break;
        }
    }

    //物体碰撞偏移
    this.CheckOffset = function(mappoint, direction, isxline) {
        var newPoint = new Point(mappoint.X, mappoint.Y);
        switch (direction) {
            //左上顶点                                              
            case 1:
                newPoint.X -= 20;
                newPoint.Y -= 20;
                break;
            //右上顶点                                              
            case 2:
                newPoint.X += 20;
                newPoint.Y -= 20;
                break;
            //左下顶点                                              
            case 3:
                newPoint.X -= 20;
                newPoint.Y += 20;
                break;
            //右下顶点                                              
            case 4:
                newPoint.X += 20;
                newPoint.Y += 20;
                break;
        }
        var lefttopmapID = GetMapIDByRelativePoint(newPoint.X, newPoint.Y);
        if (lefttopmapID !=null && townBarrierMap[lefttopmapID.Y][lefttopmapID.X] > 0 && townBarrierMap[lefttopmapID.Y][lefttopmapID.X] <= 100) {
            if (isxline) {
                var xunitNumber = parseInt(mappoint.X / 40, 10);
                this.SetPosition(xunitNumber * 40 + 20, mappoint.Y);
            }
            else {
                var yunitNumber = parseInt(mappoint.Y / 40, 10);
                this.SetPosition(mappoint.X, yunitNumber * 40 + 20);
            }

            if (this.MoveHorse != MoveHorseObject.None) {
                this.RideHorseObject.ResetPosition(this);
            }
        }
    }
}

//根据相对位置获取区块ID
function GetMapIDByRelativePoint(x, y) {
    if (x >= 0 && y >= 0 && x < 600 && y < 520) {
        var xunitNumber = parseInt(x / 40, 10);
        var yunitNumber = parseInt(y / 40, 10);

        return {X: xunitNumber, Y : yunitNumber};
    }
    return null;
}

//角色放泡泡
Role.prototype.PaoPao = function() {
    if(!this.IsDeath && !this.IsInPaopao){
        //判断是否还可以放
        if (this.CanPaopaoLength > this.PaopaoCount && !this.IsInPaopao && !this.IsDeath) {
            new Paopao(this);
        }
    }
}

//角色被炸到
Role.prototype.Bomb = function(){
    if(!this.IsDeath && !this.IsInPaopao){
        if(this.MoveHorse != MoveHorseObject.None){
            this.OutRide();
        }
        else{
            this.InPaoPao();
        }
    }
}

//进入了泡泡
Role.prototype.InPaoPao = function() {
    if(!this.IsInPaopao){
        this.MoveStep = 0.1;
        this.IsInPaopao = true;

        this.Object.SetImage(resPrefix + "Pic/Role" + this.RoleNumber + "Ani.png");
        this.Object.StartPoint.Y = 0;
        this.Object.Size = this.AniSize;

        var paopaoimage = resPrefix + "Pic/BigPopo.png";
        var bigPaopao = new Bitmap(paopaoimage);
        bigPaopao.Size = new Size(72, 72);
        var centerpoint = this.CenterPoint();
        bigPaopao.Position = new Point(centerpoint.X - bigPaopao.Size.Width / 2, centerpoint.Y - bigPaopao.Size.Height / 2 - this.Offset.Height);
        bigPaopao.ZIndex = this.Object.ZIndex + 1;

        var picnumber = 0;
        var t = this;
        var bigpaoInterval = setInterval(function() {
            if (picnumber < 3) {
                picnumber++;
                bigPaopao.StartPoint = new Point(72 * picnumber, 0);
            }
            centerpoint = t.CenterPoint();
            if (t.Object.StartPoint.X == 0) {
                t.Object.StartPoint.X = t.Object.Width;
            }
            else {
                t.Object.StartPoint.X = 0;
            }
            bigPaopao.Position = new Point(centerpoint.X - bigPaopao.Size.Width / 2, centerpoint.Y - bigPaopao.Size.Height / 2 - t.Offset.Height);
            bigPaopao.ZIndex = t.Object.ZIndex + 1;
        }, 100);

        //死亡倒计时
        var dietimeout = setTimeout(function() {
            clearInterval(bigpaoInterval);
            t.Die(bigPaopao);
            clearTimeout(dietimeout);
        }, 3000);
    }
}

//角色死亡
Role.prototype.Die = function (bigPaopao) {
    this.Object.SetImage(resPrefix + "Pic/Role" + this.RoleNumber + "Die.png");
    this.Object.Size = this.DieSize;

    var dienumber = 0;
    var t = this;
    var dieinterval = setInterval(function () {
        if (dienumber < 11) {
            t.Object.StartPoint.X = t.Object.Size.Width * dienumber;
            if (dienumber + 3 < 8) {
                bigPaopao.StartPoint.X = 72 * (dienumber + 3);
            }
            else {
                bigPaopao.Dispose();
            }
            dienumber++;
        }
        else {
            clearInterval(dieinterval);
            t.Object.Dispose();
            t.Stop();
            t = null;
        }
    }, 200);
    if (this.RoleNumber == 1) {
        SystemSound.Stop(backgroundMusic);
        SystemSound.Play(SoundType.Die, false);
    }
    this.IsDeath = true;
    this.OnDeath();
}
// 死亡时回调
Role.prototype.OnDeath = function () {

}

//角色骑上坐骑
Role.prototype.Ride = function() {
    if (!this.IsDeath && !this.IsInPaopao && this.MoveHorse != MoveHorseObject.None) {
        if(this.RawSize == null){
            this.RawSize = new Size(this.Object.Size.Width, this.Object.Size.Height);
        }
        if(this.RawOffset == null){
            this.RawOffset = new Size(this.Offset.Width, this.Offset.Height);
        }
        this.Object.Size = this.RideSize;
        if (this.RideHorseObject == null) {
            this.RideHorseObject = new RideHorse(this, this.MoveHorse);
            this.RideHorseObject.RoleOffset = this.Offset;
        }
        else {
            this.RideHorseObject.SetRideType(this.MoveHorse);
        }
        this.Object.SetImage(resPrefix + "Pic/Role" + this.RoleNumber + "Ride.png");
        this.RideHorseObject.SetDirection(this.Direction);
        switch (this.MoveHorse) {
            case MoveHorseObject.Owl:
                this.Offset.Height = this.MoveHorse.Size.Height - 10;
                break;
            case MoveHorseObject.Turtle:
                this.Offset.Height = this.MoveHorse.Size.Height;
                break;
            case MoveHorseObject.UFO:
                this.Offset.Height = this.MoveHorse.Size.Height;
                break;
        }
        //this.ResetPosition();
        this.RideHorseObject.ResetPosition(this);
    }
}

//坐骑被炸死
Role.prototype.OutRide = function(){
    if(this.MoveHorse !=  MoveHorseObject.None){
        this.Object.Size = new Size(this.RawSize.Width, this.RawSize.Height);
        this.Offset = new Size(this.RawOffset.Width, this.RawOffset.Height);
        this.MoveHorse =  MoveHorseObject.None;
        this.MoveStep = this.RawSpeed;
        this.Object.SetImage(resPrefix + "Pic/Role" + this.RoleNumber + ".png");
        this.RideHorseObject.Die();
        this.RideHorseObject = null;
    }
}

this.movetoInterval = 0;

//去任意点
Role.prototype.MoveTo = function(x, y) {
    this.Stop();
    clearInterval(this.movetoInterval)
    
    var astar = new Astar(townBarrierMap);
    var current = this.CurrentMapID();
    var paths = astar.getPath(current.Y, current.X, y, x);
    //console.log("Start:(%s, %s)  End:(%s, %s)", current.X, current.Y, x, y)
    //console.log(paths);
    
    if(paths.length > 0){
        var t = this;
        var currentnum = 0;
        var movedone = true;
        var direction;
        this.movetoInterval = setInterval(function(){
            if(movedone){
                currentnum++;
            }
            if(currentnum < paths.length){
                var currentxy = t.CurrentMapID();
                directionTemp = GetDirection(currentxy.X, currentxy.Y, paths[currentnum]);
                
                if(movedone){
                    movedone = false;
                    direction = directionTemp;
                    //console.log("Start:(%s, %s)  End:(%s, %s)", currentxy.X, currentxy.Y, paths[currentnum][1], paths[currentnum][0])
                    t.Move(direction);
                }
                else{
                    //console.log(currentxy.X, currentxy.Y,paths[currentnum][1], paths[currentnum][0])
                    var maprelativepoint = t.MapPoint();
                    if(currentxy.X == paths[currentnum][1] && currentxy.Y == paths[currentnum][0] 
                        && maprelativepoint.X % 40 > 0 && maprelativepoint.X % 40 < 40
                        && maprelativepoint.Y % 40 > 0 && maprelativepoint.Y % 40 < 40){
                        movedone = true;
                        t.Stop();
                    }
                }
            }
            else{
                clearInterval(t.movetoInterval);
            }
        }, 10);
    }
}

//获取相对位置的方向
function GetDirection(x, y, pathxy){
    //console.log(x, y, pathxy);
    var direct;
    //0是y, 1是x
    if(pathxy[1] - x > 0){
        direct = Direction.Right;
    }
    else if(pathxy[1] - x < 0){
        direct = Direction.Left
    }
    else if(pathxy[0] - y > 0){
        direct = Direction.Down;
    }
    else if(pathxy[0] - y < 0){
        direct = Direction.Up;
    }
    return direct;
}

//获取地图点的相对坐标
function GetMapPointXY(mapid){
    return {X : (mapid % 15), Y : parseInt(mapid / 15, 10) };
}