var resPrefix = 'game/';

//泡泡
var PaopaoArray = [];

//泡泡
var Paopao = function(role) {
    this.Master = role;
    this.PaopaoStrong = role.PaopaoStrong;
    this.CurrentMapID = role.CurrentMapID();

    if (townBarrierMap[this.CurrentMapID.Y][this.CurrentMapID.X] == 0) {
        townBarrierMap[this.CurrentMapID.Y][this.CurrentMapID.X] = 100;
        this.Object = new Bitmap(resPrefix + "Pic/Popo.png");

        //初始化
        {
            this.Master.PaopaoCount++;
            this.Object.ZIndex = this.Master.Object.ZIndex - 1;

            //设置位置
            this.Object.Position = new Point(this.CurrentMapID.X * 40 + 20 - 2, this.CurrentMapID.Y * 40 + 40 - 5);

            //声音
            SystemSound.Play(SoundType.Appear);

            this.Object.Size = new Size(44, 41);

            var poponumber = 0;

            var t = this;
            var popoInterval = setInterval(function() {
                if (poponumber >= 3) {
                    poponumber = 0;
                }
                t.Object.StartPoint = new Point(poponumber * 44, 0);
                poponumber++;
            }, 200);

            //发生爆炸
            var popoTimeout = setTimeout(function() {
                t.Bomb();
            }, 3000);
            
            if(!PaopaoArray[this.CurrentMapID.Y]){
                PaopaoArray[this.CurrentMapID.Y] = [];
            }
            //加入泡泡集合
            PaopaoArray[this.CurrentMapID.Y][this.CurrentMapID.X] = this;
        }

        //泡泡爆炸
        this.Bomb = function() {
        
            clearInterval(popoInterval);
            this.Object.Dispose();
            PopoBang(this.CurrentMapID, this.PaopaoStrong, this.Master);
            this.Master.PaopaoCount--;
            clearTimeout(popoTimeout);
            PaopaoArray[this.CurrentMapID.Y][this.CurrentMapID.X] = null;
            townBarrierMap[this.CurrentMapID.Y][this.CurrentMapID.X] = 0;
        }
    }
}


//泡泡爆炸
function PopoBang(mapid, strong, role){
    var explosionimage = resPrefix + "Pic/Explosion.png";
    var xymapidarray = FindPaopaoBombXY(mapid.X + mapid.Y * 15, strong);
    //X轴方向
    var xmaparray = xymapidarray.X;
    //Y轴方向
    var ymaparray = xymapidarray.Y;

    //泡泡位置
    var point = new Point(mapid.X * 40 + 20, mapid.Y * 40 + 40);
    SystemSound.Play(SoundType.Explode);
    
    var BombXUnits = [];
    for(var i = 0; i < xmaparray.length; i++){
        BombXUnits[i] = new Bitmap(explosionimage);
        BombXUnits[i].Size = new Size(40, 40);
        BombXUnits[i].ZIndex = 3;
        BombXUnits[i].Position = new Point((xmaparray[i] % 15) * 40 + 20, point.Y);
        
        //第一个
        if(i == 0 && xmaparray[i] < mapid){
            BombXUnits[i].StartPoint = new Point(200, 80);
        }
        //最后一个
        else if(i == xmaparray.length - 1 && xmaparray[i] > mapid){
            BombXUnits[i].StartPoint = new Point(200, 120);
        }
        //左边
        else if(xmaparray[i] < mapid){
            BombXUnits[i].StartPoint = new Point(120, 80);
        }
        //右边
        else{
            BombXUnits[i].StartPoint = new Point(120, 120);
        }
    }
    
    var BombYUnits = [];
    for(var i = 0; i < ymaparray.length; i++){
        BombYUnits[i] = new Bitmap(explosionimage);
        BombYUnits[i].Size = new Size(40, 40);
        BombYUnits[i].Position = new Point(point.X, parseInt(ymaparray[i] / 15, 10) * 40 + 40);
        BombYUnits[i].ZIndex = 3;
        
        //第一个
        if(i == 0 && ymaparray[i] < mapid){
            BombYUnits[i].StartPoint = new Point(200, 0);
        }
        //最后一个
        else if(i == ymaparray.length - 1 && ymaparray[i] > mapid){
            BombYUnits[i].StartPoint = new Point(200, 40);
        }
        //上边
        else if(ymaparray[i] < mapid){
            BombYUnits[i].StartPoint = new Point(120, 0);
        }
        //下边
        else{
            BombYUnits[i].StartPoint = new Point(120, 40);
        }
    }
    var bongbongCenter = new Bitmap(explosionimage);
    bongbongCenter.StartPoint = new Point(0, 160);
    bongbongCenter.Size = new Size(40, 40);
    bongbongCenter.Position = point;
    bongbongCenter.ZIndex = 3;

    //debugger;
    
    var bongbongpicnumber = 6;
    var bongbongpiccenternumber = 1;

    var isRemoveMapUnit = false;
    var bongbongInterval = setInterval(function() {
        if (bongbongpicnumber > 13) {
            for(var xunit in BombXUnits){
                BombXUnits[xunit].Dispose();
            }
            for(var yunit in BombYUnits){
                BombYUnits[yunit].Dispose();
            }
            bongbongCenter.Dispose();
            clearInterval(bongbongInterval);
        }
        else {
            if (bongbongpiccenternumber > 3) {
                bongbongpiccenternumber = 0;
            }
            if (!isRemoveMapUnit) {
                //消除炸掉的方块
                var allmapidarray = xmaparray.concat(ymaparray);
                allmapidarray.push(mapid.Y * 15 + mapid.X);
                for(var i=0; i< allmapidarray.length; i++){
                    //直接引爆该区域的泡泡
                    if(townBarrierMap[Math.floor(allmapidarray[i]/15)][allmapidarray[i] % 15] == 100){
                        PaopaoArray[Math.floor(allmapidarray[i]/15)][allmapidarray[i] % 15].Bomb();
                    }
                    
                    for(var m = 0; m< RoleStorage.length; m++){
                        var role1 = RoleStorage[m];
                        //角色是否被炸到
                        var role1mapid = role1.CurrentMapID();
                        if (!role1.IsDeath && role1mapid.Y * 15 + role1mapid.X == allmapidarray[i]) {
                            role1.Bomb();
                        }
                    }
                    Barrier.Bomb(allmapidarray[i] % 15, parseInt(allmapidarray[i]/15, 10));
                }
                isRemoveMapUnit = true;
            }
            
            for(var i = 0; i < xmaparray.length; i++){
                if(i == 0 || i == xmaparray.length - 1){
                    BombXUnits[i].StartPoint.X = 40 * bongbongpicnumber;
                }
            }
            for(var i = 0; i < ymaparray.length; i++){
                if(i == 0 || i == ymaparray.length - 1){
                    BombYUnits[i].StartPoint.X = 40 * bongbongpicnumber;
                }
            }
            bongbongCenter.StartPoint = new Point(bongbongpiccenternumber * 40, 160);
            bongbongpicnumber++;
            bongbongpiccenternumber++;
        }
    }, 50);
}

//找出爆炸的MapID集合
function FindPaopaoBombXY(mapid, strong){
    //X轴方向
    var xmaparray = [];
    //Y轴方向
    var ymaparray = [];
    //是否可以前进
    var cango = {Up : true, Down : true, Left : true, Right : true};
    for(var i=1; i<= strong; i++){
        if(mapid + i < 195 && mapid % 15 + i < 15){
            if(cango.Right){
                var b = Barrier.Storage[Math.floor((mapid + i) / 15)][(mapid + i) % 15];
                if(b &&  b.No > 3 && b.No < 100){
                    cango.Right = false;
                }
                else if(b && b.No > 0 && b.No <= 3){
                    xmaparray.push(mapid + i);
                    cango.Right = false;
                }
            }
            if(cango.Right){
                xmaparray.push(mapid + i);
            }
        }
        
        if(mapid - i >= 0 && mapid % 15 - i >= 0){
            if(cango.Left){
                var b = Barrier.Storage[Math.floor((mapid - i) / 15)][(mapid - i) % 15];
                if(b && b.No > 3 && b.No < 100){
                    cango.Left = false;
                }
                else if(b && b.No > 0 && b.No <= 3){
                    xmaparray.push(mapid - i);
                    cango.Left = false;
                }
            }
            if(cango.Left){
                xmaparray.push(mapid - i);
            }
        }
        
        if(mapid + i * 15 < 195){
            if(cango.Down){
                var b = Barrier.Storage[Math.floor((mapid + i * 15) / 15)][(mapid + i * 15) % 15];
                if(b != null &&  b.No > 3 && b.No < 100){
                    cango.Down = false;
                }
                else if(b && b.No > 0 && b.No <= 3){
                    ymaparray.push(mapid + i * 15);
                    cango.Down = false;
                }
            }
            if(cango.Down){
                ymaparray.push(mapid + i * 15);
            }
        }
        
        if(mapid - i * 15 >= 0){
            if(cango.Up){
                var b = Barrier.Storage[Math.floor((mapid - i*15) / 15)][(mapid - i*15) % 15];
                if(b &&  b.No > 3 && b.No < 100){
                    cango.Up = false;
                }
                else if(b && b.No > 0 && b.No <= 3){
                    ymaparray.push(mapid - i * 15);
                    cango.Up = false;
                }
            }
            if(cango.Up){
                ymaparray.push(mapid - i * 15);
            }
        }
    }
    xmaparray.sort(function(a, b){
        return +(a) - +(b);
    });
    ymaparray.sort(function(a, b){
        return +(a) - +(b);
    });
    
    return {X: xmaparray, Y: ymaparray};
}