var GiftStorage = [];
var resPrefix = 'game/';

//障碍物对象
var Barrier = {
    //障碍物仓库
    Storage: [],

    //障碍物文件库
    Materials: {
        1: { Url: resPrefix + "Pic/TownBlockRed.png", Offset: new Size(0, 4) },
        2: { Url: resPrefix + "Pic/TownBlockYellow.png", Offset: new Size(0, 4) },
        //箱子炸开后会可能会出现宝物
        3: { Url: resPrefix + "Pic/TownBox.png", Offset: new Size(0, 4) },
        4: { Url: resPrefix + "Pic/TownHouseBlue.png", Offset: new Size(0, 17) },
        5: { Url: resPrefix + "Pic/TownHouseRed.png", Offset: new Size(0, 17) },
        6: { Url: resPrefix + "Pic/TownHouseYellow.png", Offset: new Size(0, 17) },
        7: { Url: resPrefix + "Pic/TownTree.png", Offset: new Size(0, 27) },

        //100为泡泡
        //宝物
        101: { Url: resPrefix + "Pic/Gift1.png", Offset: new Size(1, 2 + 10) },
        102: { Url: resPrefix + "Pic/Gift2.png", Offset: new Size(1, 2 + 10) },
        103: { Url: resPrefix + "Pic/Gift3.png", Offset: new Size(1, 2 + 10) },
        104: { Url: resPrefix + "Pic/Gift4.png", Offset: new Size(1, 2 + 10) },
        105: { Url: resPrefix + "Pic/Gift5.png", Offset: new Size(1, 2 + 10) },
        106: { Url: resPrefix + "Pic/Gift6.png", Offset: new Size(1, 2 + 10) },
        107: { Url: resPrefix + "Pic/Gift7.png", Offset: new Size(-2, -1 + 10) },
        108: { Url: resPrefix + "Pic/Gift8.png", Offset: new Size(-2, -1 + 10) },
        109: { Url: resPrefix + "Pic/Gift9.png", Offset: new Size(0, 0 + 10) },
        110: { Url: resPrefix + "Pic/Gift8.png", Offset: new Size(-2, -1 + 10) }   //慢乌龟显示的图片
    },

    //创建对象
    Create: function (x, y, num) {
        var barrierunit = Barrier.Materials[num];
        if (barrierunit) {
        //修改判断第一行逻辑，否则会把箱子推到地板的下一层
            var zindex = y + 1;
            zindex = zindex * 2;
            if (num > 3 && num < 100) {
                zindex += 2;
            }

            var position = new Point(20 + 40 * x - barrierunit.Offset.Width, 40 + 40 * y - barrierunit.Offset.Height);
            var barrierunit = new Bitmap(barrierunit.Url);
            barrierunit.ZIndex = zindex;
            barrierunit.Position = position;

            // ========== 新增：礼物无敌标记 ==========
            var invincibleUntil = 0;

            // 如果是宝物（编号>100），额外处理动画和阴影
            if (num > 100) {
                if (num == 107) {
                    barrierunit.Size = new Size(36, 38);
                }
                else if (num == 108) {
                    barrierunit.Size = new Size(36, 41);
                }
                else if (num == 109) {
                    barrierunit.Size = new Size(40, 41);
                }
                else if (num == 110) {
                    barrierunit.Size = new Size(36, 41);
                }
                else {
                    barrierunit.Size = new Size(42, 45);
                }
                var picnumber = 0;
                var binterval = setInterval(function () {
                    if (barrierunit.Visible) {
                        if (picnumber > 2) picnumber = 0;
                        barrierunit.StartPoint = new Point(barrierunit.Size.Width * picnumber, 0);
                        picnumber++;
                    }
                    else {
                        clearInterval(binterval);
                    }
                }, 400);

                //影子
                var shadowobject = new Bitmap(resPrefix + "Pic/ShadowGift.png");
                shadowobject.Size = new Size(18, 9);
                shadowobject.Position = new Point(20 + 40 * x + 20 - 9, 40 + 40 * y + 20 + 8);
                shadowobject.ZIndex = zindex - 1;

                var positonnumber = 0;
                //默认向上
                var floatdirect = true;
                var shadowinterval = setInterval(function () {
                    if (barrierunit.Visible) {
                        if (positonnumber > 4 || positonnumber < 0) floatdirect = !floatdirect;
                        if (!floatdirect) {
                            barrierunit.Position.Y += 1;
                            positonnumber--;
                        }
                        else {
                            barrierunit.Position.Y -= 1;
                            positonnumber++;
                        }
                        if (positonnumber <= 0) {
                            shadowobject.StartPoint.X = 18;
                        }
                        else {
                            shadowobject.StartPoint.X = 0;
                        }
                    }
                    else {
                        shadowobject.Dispose();
                        clearInterval(shadowinterval);
                    }
                }, 100);

                // ========== 新增：为礼物设置无敌时间（500ms），避免被同一爆炸波次误伤 ==========
                invincibleUntil = Date.now() + 100;
                //console.log("[bnbBarrier.js] 礼物生成，无敌截止时间=" + invincibleUntil);
            }
            if (Barrier.Storage[y] == null) {
                Barrier.Storage[y] = [];
            }
            //增加礼物的无敌时间属性
            Barrier.Storage[y][x] = { Object: barrierunit, No: num, invincibleUntil: invincibleUntil };
        }
    },

    // 炸弹爆炸时调用：清除指定网格(x,y)上的障碍物，并处理箱子掉落宝物
    Bomb: function (x, y) {
        var b = Barrier.Storage[y][x];
        if (b != null) {
            // 如果为宝物(>100)，检查无敌状态，无敌中则不销毁
            if (b.No > 100) {
                // ========== 新增：无敌保护 ==========
                if (b.invincibleUntil && Date.now() < b.invincibleUntil) {
                    //console.log("[bnbBarrier.js] 礼物处于无敌状态，跳过销毁 (x=" + x + ",y=" + y + ")");
                    return; // 无敌期间不销毁
                }
                b.Object.Dispose();
                townBarrierMap[y][x] = 0;
                Barrier.Storage[y][x] = 0;
                b = null;
            }
            // 如果为砖块或木箱
            else if (b.No > 0 && b.No <= 3) {
                // 随机生成一个礼物编号，并更新地图数据
                townBarrierMap[y][x] = CreateRandomGift(); // 原注释提示用GiftStorage，实际调用随机生成函数
                b.Object.Dispose();
                // 在该位置重新创建宝物（此时编号已成为礼物编号）
                Barrier.Create(x, y, townBarrierMap[y][x]);
            }
        }
    }
}

function DrawBarrierMap(){
    //创建障碍物
    for (var i = 0; i < townBarrierMap.length; i++) {
        for(var j = 0; j < townBarrierMap[i].length; j++){
            var unitNumber = townBarrierMap[i][j];
            if (unitNumber > 0) {
                Barrier.Create(j, i, unitNumber);
            }
        }
    }
}

var GiftSeed = 0.4;
function CreateRandomGift() {
    //return 100 + Math.floor(Math.random() * 9 + 1);
    var num = GiftSeed * 23 - 6.234;
    GiftSeed = num - Math.floor(num);
    return 100 + Math.floor(GiftSeed * 10 + 1);
}
