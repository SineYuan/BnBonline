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

            // 播放放置泡泡的音效
            // SystemSound.Play(SoundType.Appear);
            SystemSound.Play(SoundType.Lay);

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

        this.Clear = function() {
            // 停止闪烁动画
            clearInterval(popoInterval);
            // 销毁泡泡图片对象
            this.Object.Dispose();
            // 角色的泡泡计数减一
            this.Master.PaopaoCount--;
            // 清除爆炸倒计时定时器
            clearTimeout(popoTimeout);
            // 将全局数组中该位置的泡泡引用置空
            PaopaoArray[this.CurrentMapID.Y][this.CurrentMapID.X] = null;
            // 地图格子状态重置为 0（空地）
            townBarrierMap[this.CurrentMapID.Y][this.CurrentMapID.X] = 0;
        }
    }
}


var KickPaopao = function(role, KickPaopao_Y, KickPaopao_X) {
    //console.log("[bnbPaopao.js] 踢泡泡 新泡泡的位置是 (" + KickPaopao_X + "," + KickPaopao_Y + ")");
    // 记录放置该泡泡的角色
    this.Master = role;
    // 泡泡的威力（爆炸范围），从角色的属性中获取
    this.PaopaoStrong = role.PaopaoStrong;
    // 记录泡泡放置时的地图格子坐标（包含 X, Y 属性）
    this.CurrentMapID = {X : KickPaopao_X, Y : KickPaopao_Y};

    // 只有当前格子没有被其他泡泡占据时才创建泡泡（0 表示空地）
    if (townBarrierMap[KickPaopao_Y][KickPaopao_X] == 0) {
        // 将该格子标记为 100，表示有泡泡存在
        townBarrierMap[KickPaopao_Y][KickPaopao_X] = 100;
        // 创建泡泡的图片对象，使用 Pic/Popo.png 图片
        this.Object = new Bitmap(resPrefix + "Pic/Popo.png");

        // 初始化泡泡的相关属性
        {
            // // 角色的泡泡计数加一
            this.Master.PaopaoCount++;
            // 设置泡泡的 Z 轴层级比角色低一层（显示在角色下方）
            this.Object.ZIndex = this.Master.Object.ZIndex - 1;

            // 设置泡泡的显示位置
            // 地图每个格子宽 40，高 40，泡泡图片锚点微调（-2, -5）使对齐更自然
            this.Object.Position = new Point(KickPaopao_X * 40 + 20 - 2, KickPaopao_Y * 40 + 40 - 5);

            // 播放放置泡泡的音效
              SystemSound.Play(SoundType.Appear);
            //SystemSound.Play(SoundType.Lay);

            // 设置泡泡图片的尺寸（宽 44，高 41）
            this.Object.Size = new Size(44, 41);

            // 用于动画帧切换的索引（0,1,2 循环）
            var poponumber = 0;

            // 保存当前泡泡对象的引用，用于定时器内部
            var t = this;
            // 设置定时器，每 200 毫秒切换一帧，实现泡泡闪烁动画
            var popoInterval = setInterval(function() {
                if (poponumber >= 3) {
                    poponumber = 0;
                }
                // 改变图片的起始绘制点，实现精灵图动画（每帧宽 44 像素）
                t.Object.StartPoint = new Point(poponumber * 44, 0);
                poponumber++;
            }, 200);

            // 设置定时器，3 秒后自动爆炸
            var popoTimeout = setTimeout(function() {
                t.Bomb();
            }, 3000);
            
            // 确保 PaopaoArray 对应行存在
            if(!PaopaoArray[KickPaopao_Y]){
                PaopaoArray[KickPaopao_Y] = [];
            }
            // 将当前泡泡存入全局数组，以便后续爆炸时根据坐标快速查找
            PaopaoArray[KickPaopao_Y][KickPaopao_X] = this;
        }

        /**
         * 泡泡爆炸的方法
         * 清除动画定时器，销毁图片，触发爆炸效果，并清理相关数据
         */
        this.Bomb = function() {
            // 停止闪烁动画
            clearInterval(popoInterval);
            // 销毁泡泡图片对象
            this.Object.Dispose();
            // 调用全局爆炸函数，传入位置、威力和放置者信息
            PopoBang(this.CurrentMapID, this.PaopaoStrong, this.Master);
            // 角色的泡泡计数减一
            this.Master.PaopaoCount--;
            // 清除爆炸倒计时定时器
            clearTimeout(popoTimeout);
            // 将全局数组中该位置的泡泡引用置空
            PaopaoArray[KickPaopao_Y][KickPaopao_X] = null;
            // 地图格子状态重置为 0（空地）
            townBarrierMap[KickPaopao_Y][KickPaopao_X] = 0;
        }

        this.Clear = function() {
            // 停止闪烁动画
            clearInterval(popoInterval);
            // 销毁泡泡图片对象
            this.Object.Dispose();
            // 角色的泡泡计数减一
            this.Master.PaopaoCount--;
            // 清除爆炸倒计时定时器
            clearTimeout(popoTimeout);
            // 将全局数组中该位置的泡泡引用置空
            PaopaoArray[KickPaopao_Y][KickPaopao_X] = null;
            // 地图格子状态重置为 0（空地）
            townBarrierMap[KickPaopao_Y][KickPaopao_X] = 0;
        }
    }
}

/**
 * 泡泡爆炸的核心函数
 * @param {Object} mapid - 爆炸中心点的地图坐标（包含 X, Y）
 * @param {number} strong - 爆炸威力（向四个方向延伸的格子数）
 * @param {Object} role - 放置该泡泡的角色（用于判定某些逻辑，如是否有道具加成）
 */
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
                            // 确保角色有无敌截止时间属性，默认为0（没有无敌）
                            if (role1.invincibleUntil === undefined) {
                                role1.invincibleUntil = 0;
                            }
                            // 如果当前时间小于无敌截止时间，则跳过本次爆炸伤害（角色处于无敌状态）
                            if (Date.now() < role1.invincibleUntil) {
                                //console.log("[bnbPaopao.js] 角色 " + role1.RoleNumber + " 处于无敌状态，免疫爆炸伤害");
                                continue; // 无敌状态，不进行伤害
                            }
                            // 记录爆炸前的骑乘状态（关键：判断玩家是否骑乘动物）
                            var wasRiding = (role1.MoveHorse !== undefined && role1.MoveHorse !== 0); // MoveHorseObject.None 通常为0
                            // 调用角色的爆炸受伤方法（内部会处理下骑乘或进入泡泡）
                            role1.Bomb();
                            // 如果爆炸前角色是骑乘状态，那么爆炸后角色已经下马（OutRide 已在 Bomb 中调用）
                            // 此时给予角色 500ms 无敌时间，防止同一爆炸波次中其他泡泡的二次伤害
                            if (wasRiding) {
                                role1.invincibleUntil = Date.now() + 500;
                                //console.log("[bnbPaopao.js] 角色 " + role1.RoleNumber + " 因骑乘动物被炸，获得500ms无敌，到期时间=" + role1.invincibleUntil);
                            }
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
                // ========== 新增：处理无敌中的礼物（编号 > 100 且 invincibleUntil 有效） ==========
                // 无敌礼物会阻挡爆炸（类似可破坏箱子），但不会被销毁（见 Barrier.Bomb 中的无敌保护）
                if(b && b.No > 100 && b.invincibleUntil && Date.now() < b.invincibleUntil) {
                    console.log("[bnbPaopao.js] 发现无敌礼物，爆炸停止于此格子");
                    xmaparray.push(mapid + i);   // 该格子会被爆炸动画覆盖
                    cango.Right = false;         // 停止继续向右延伸
                }
                // 如果障碍物编号 >3 且 <100，表示是不可破坏的墙壁，阻挡爆炸不再向右延伸
                else if(b &&  b.No > 3 && b.No < 100){
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
                // ========== 新增：无敌礼物阻挡 ==========
                if(b && b.No > 100 && b.invincibleUntil && Date.now() < b.invincibleUntil) {
                    console.log("[bnbPaopao.js] 发现无敌礼物，爆炸停止于此格子");
                    xmaparray.push(mapid - i);
                    cango.Left = false;
                }
                else if(b && b.No > 3 && b.No < 100){
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
                // ========== 新增：无敌礼物阻挡 ==========
                if(b && b.No > 100 && b.invincibleUntil && Date.now() < b.invincibleUntil) {
                    console.log("[bnbPaopao.js] 发现无敌礼物，爆炸停止于此格子");
                    ymaparray.push(mapid + i * 15);
                    cango.Down = false;
                }
                else if(b != null &&  b.No > 3 && b.No < 100){
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
                // ========== 新增：无敌礼物阻挡 ==========
                if(b && b.No > 100 && b.invincibleUntil && Date.now() < b.invincibleUntil) {
                    console.log("[bnbPaopao.js] 发现无敌礼物，爆炸停止于此格子");
                    ymaparray.push(mapid - i * 15);
                    cango.Up = false;
                }
                else if(b &&  b.No > 3 && b.No < 100){
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