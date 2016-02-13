var MonsterCount = 3;

//怪物电脑
var Monster = function() {
    this.Role = new Role(2);
    this.Role.Offset = new Size(0, 17);
    this.Role.RideSize = new Size(56, 60);
    this.Role.Offset = new Size(0, 17);
    this.Role.Object.Size = new Size(56, 67);
    this.Role.AniSize = new Size(56, 70);
    this.Role.DieSize = new Size(56, 98);
    this.Role.MoveStep = 3;
    this.Role.SetRawSpeed(3);
    this.Role.CanPaopaoLength = 1;

    //去位置
    this.SetMap = function(x, y) {
        this.Role.SetToMap(x, y);
    }

    //随机移动线程
    this.Start = function() {
        var role = this.Role;
        MonsterAction(role);
        var moveinterval = setInterval(function() {
            if (!role.IsDeath && !role.IsInPaopao) {
                MonsterAction(role);
            }
            else {
                clearInterval(moveinterval);
            }
        }, (40 / role.MoveStep) * 20);
    }
}

var MonsterStorage = [];

for(var i=0; i < MonsterCount; i++){
    var mapID = {X: Math.floor(Math.random() * 15), Y: Math.floor(Math.random() * 13)};
    
    if(townBarrierMap[mapID.Y][mapID.X] == 0){
        var monster = new Monster();
        monster.SetMap(mapID.X, mapID.Y);
        monster.Start();
        MonsterStorage.push(monster);
    }
    else{
        i--;
    }
}

//怪物电脑动作
function MonsterAction(monsterRole) {
    monsterRole.Stop();
    //随机移动方向
    monsterRole.Move(Math.floor(Math.random() * 4));
    
    if(monsterRole.CanPaopaoLength > 0){
        //随机放泡泡
        if(Math.random() * 10 > 6){
            monsterRole.PaoPao();
        }
    }
}

//算出移动方向
function MoveDirection(monsterRole){
    var mapid = monsterRole.CurrentMapID();
    var maybebombmaparray = [];    
    //可能发生爆炸的点
    for(var id in PaopaoArray){
        for(var id2 in PaopaoArray[id]){
            if(PaopaoArray[id][id2] != null){
                var bombpoints = FindPaopaoBombXY(PaopaoArray[id][id2].CurrentMapID.X + PaopaoArray[id][id2].CurrentMapID.Y * 15, PaopaoArray[id][id2].PaopaoStrong);
                for (var p in bombpoints.X) {
                    maybebombmaparray.push(bombpoints.X[p]);
                }
                for (var p in bombpoints.Y) {
                    maybebombmaparray.push(bombpoints.Y[p]);
                }
            }
        }
    }
    //console.log(maybebombmaparray);
    
    var allmaps = [];
    for(var i=0; i< 195; i++){
        allmaps.push(i);
    }

    //获取所有的安全点数组
    var safemaps = filter(allmaps, maybebombmaparray);
    //console.log(safemaps);

    //随即去一个安全点
    var gotomapid = Math.floor(Math.random() * safemaps.length);
    //console.log(safemaps[gotomapid]);
    return safemaps[gotomapid];
}

//数组是否包含元素
function ArrayContain(array, unit) {
    var i = 0;
    for(i=0;i<array.length && array[i]!=unit;i++);
    return !(i==array.length);
}

//除去数组1中数组2的部分
function filter(array1, array2) {
    var myAry = [];
    for (var i = 0; i < array1.length; i++) {
        if (!ArrayContain(array2, array1[i]))
            myAry.push(array1[i]);
    }
    return myAry;
} 