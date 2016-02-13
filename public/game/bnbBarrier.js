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
        109: { Url: resPrefix + "Pic/Gift9.png", Offset: new Size(0, 0 + 10) }
    },

    //创建对象
    Create: function (x, y, num) {
        var barrierunit = Barrier.Materials[num];
        if (barrierunit) {
            var zindex = y;
            zindex += x > 0 ? 1 : 0;
            zindex = zindex * 2;
            if (num > 3 && num < 100) {
                zindex += 2;
            }

            var position = new Point(20 + 40 * x - barrierunit.Offset.Width, 40 + 40 * y - barrierunit.Offset.Height);
            var barrierunit = new Bitmap(barrierunit.Url);
            barrierunit.ZIndex = zindex;
            barrierunit.Position = position;

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
            }
            if (Barrier.Storage[y] == null) {
                Barrier.Storage[y] = [];
            }
            Barrier.Storage[y][x] = { Object: barrierunit, No: num };
        }
    },

    //爆炸掉,区块序号
    Bomb: function (x, y) {
        var b = Barrier.Storage[y][x];
        if (b != null) {
            if ((b.No > 0 && b.No < 3) || b.No > 100) {
                b.Object.Dispose();
                townBarrierMap[y][x] = 0;
                b = null;
            }
            else if (b.No == 3) {
                townBarrierMap[y][x] = CreateRandomGift(); //GiftStorage[y][x];
                b.Object.Dispose();
                //生成宝物
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
    return 100 + Math.floor(GiftSeed * 9 + 1);
}