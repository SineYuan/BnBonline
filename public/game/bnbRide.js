var resPrefix = 'game/';

//坐骑数据
var MoveHorseObject = {
    None: {},
    Owl: { Url: "Owl.png", Size: new Size(40, 40) },
    Turtle: { Url: "Turtle.png", Size: new Size(48, 32) },
    UFO: { Url: "FastUFO.png", Size: new Size(52, 31) }
}


//角色坐骑对象
var RideHorse = function(role, horseType) {
    this.Object = new Bitmap(resPrefix + "Pic/" + horseType.Url);
    this.Object.Size = horseType.Size;
    var centerPoint = role.CenterPoint();
    this.Object.Position = new Point(centerPoint.X - horseType.Size.Width / 2, centerPoint.Y - horseType.Size.Height / 2);
    this.Object.ZIndex = role.Object.ZIndex - 1;
    
    //记录Role的Offset
    this.RoleOffset = null;
}

//设置坐骑方向
RideHorse.prototype.SetDirection = function(direction) {
    this.Object.Direction = direction;
    this.Object.StartPoint.Y = direction * this.Object.Size.Height;
}

//设置坐骑角色
RideHorse.prototype.SetRideType = function(horseType) {
    this.Object.SetImage(resPrefix + "Pic/" + horseType.Url);
    this.Object.Size = horseType.Size;
}

//坐骑位置重置
RideHorse.prototype.ResetPosition = function(role) {
    var centerPoint = role.CenterPoint();
    this.Object.Position = new Point(centerPoint.X - this.Object.Size.Width / 2, centerPoint.Y - this.Object.Size.Height / 2);
    this.Object.ZIndex = role.Object.ZIndex;
}

//坐骑死亡
RideHorse.prototype.Die = function(){
    this.Object.Dispose();
}