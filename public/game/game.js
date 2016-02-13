//主画板
var Game = function (width, height) {
    this.Height = height;
    this.Width = width;
    this.gamecanvas = document.createElement("canvas");
    this.gamecanvas.type = "canvas";
    this.gamecanvas.id = randonID();

    this.gamecanvas.setAttribute("height", this.Height);
    this.gamecanvas.setAttribute("width", this.Width);

    document.body.appendChild(this.gamecanvas);

    this.context = document.getElementById(this.gamecanvas.id).getContext("2d");

    this.SetPosition = function (sprite, point) {
        if (!point) point = new Point(0, 0);

        switch (sprite.Type) {
            //Bitmap                        
            case "Bitmap":
                sprite.SetPosition(this.context, point);
                break;
        }
    }

    //鼠标移动事件
    this.gamecanvas.onclick = function (e) {
        for (var i = 0; i < Game.SpriteArray.length; i++) {
            var o = Game.SpriteArray[i];
            if (o.Click != null) {
                if (CheckInSprite(o.Position, o.EndPosition(), new Point(e.offsetX, e.offsetY))) {
                    o.Click(e);
                }
            }
        }
    }

    var isDrag = false;
    var spriteID = -1;

    this.gamecanvas.onmousedown = function (e) {
        isDrag = true;
        for (var i = 0; i < Game.SpriteArray.length; i++) {
            var o = Game.SpriteArray[i];
            if (o.Drag) {
                if (CheckInSprite(o.Position, o.EndPosition(), new Point(e.layerX, e.layerY))) {
                    spriteID = i;
                }
            }
        }
    }

    this.gamecanvas.onmouseup = function (e) {
        isDrag = false;
        spriteID = -1;
    }

    this.gamecanvas.onmousemove = function (e) {
        if (isDrag && spriteID > -1) {
            Game.SpriteArray[spriteID].Drag(e);
        }
    }

    this.ExceptFPS = 30;

    this.Interval = parseInt(1000 / this.ExceptFPS, 10);

    this.FrameCount = 0;

    this.LastFrameTime = (new Date()).getTime();

    this.FPS = 0;


    //启动游戏
    this.Start = function () {
        //主线程(FPS)
        Game.Draw(this);
    }
}

//Game的静态方法和属性
{
    //精灵数库
    Game.SpriteArray = new Array();

    Game.AudioMap = [];

    //需要载入的对象数
    Game.NeedLoadObjectsCount = 0;

    //已载入的对象数
    Game.LoadedObjectsCount = 0;

    //显示
    Game.Draw = function (t) {
        t.Interval = parseInt(1000 / t.ExceptFPS, 10);
        if (Game.NeedLoadObjectsCount <= Game.LoadedObjectsCount) {
            //处理FPS (保证每秒钟在30帧左右)
            t.FPS = Math.round((t.FrameCount * 10000) / ((new Date()).getTime() - t.LastFrameTime)) / 10;

            if (t.FrameCount >= t.ExceptFPS) {
                if (t.FPS < t.ExceptFPS - 0.5) {
                    t.Interval--;
                }
                else if (t.FPS > t.ExceptFPS + 0.5) {
                    t.Interval++;
                }
                //阶段统计初始化
                t.FrameCount = 0;
                t.LastFrameTime = (new Date()).getTime();
            }

            //处理精灵数组
            for (var i = 0; i < Game.SpriteArray.length; i++) {
                var o = Game.SpriteArray[i];
                if (!o.Visible) {
                    Game.SpriteArray[i] = null;
                    //删除数组元素
                    Game.SpriteArray.splice(i, 1);
                }
            }

            //绘制屏幕
            t.context.save();
            t.context.clearRect(0, 0, t.Width, t.Height);
            var diplayedcount = 0;
            var currentZIndex = 0;
            while (diplayedcount < Game.SpriteArray.length) {
                for (var i = 0; i < Game.SpriteArray.length; i++) {
                    var o = Game.SpriteArray[i];
                    if (o.ZIndex == currentZIndex) {
                        o.Show(t.context);
                        diplayedcount++;
                    }
                }
                currentZIndex++;
            }
            t.context.restore();

            //帧数统计
            t.FrameCount++;
        }
        setTimeout(function () {
            Game.Draw(t);
        }, t.Interval);
    }

    //封装setInterval函数
    Game.Thread = function (callback, timeout, param) {
        var args = Array.prototype.slice.call(arguments, 2);
        var _cb = function () {
            callback.apply(null, args);
        }
        setInterval(_cb, timeout);
    }

    //载入完毕后执行方法
    Game.Ready = function (fn) {
        if (Game.NeedLoadObjectsCount == Game.LoadedObjectsCount) {
            var __loadcomplete = setInterval(function () {
                clearInterval(__loadcomplete);
                fn();
            }, 100);
        }
    }

    //动态载入JS文件
    Game.LoadScript = function (fileurl) {
        var scriptobject = document.createElement("script");
        scriptobject.src = fileurl;
        document.body.insertAdjacentElement("BeforeBegin", scriptobject);
    }
}

//音频控制对象
var Sound = function (url) {

    //循环播放
    this.Loop = false;

    //是否处于播放中
    this.IsPlaying = false;

    //Audio对象
    this.Audio = new Audio();
    this.Audio.src = url;
    this.Audio.load();

    //Game.NeedLoadObjectsCount++;
    //'canplaythrough'
    //audio.addEventListener("loadeddata", function(e) {
    //Game.LoadedObjectsCount++;
    //}, true);

    //设置声音大小
    this.SetVolume = function (value) {
        this.Audio.volume = value;
    }

    //播放
    this.Play = function () {
        this.IsPlaying = true;
        var t = this;
        if (this.Loop) {
            this.Audio.loop = 'loop';
            this.Audio.addEventListener('ended', function () {
                t.Audio.currentTime = 0;
            }, false);
        }
        else {
            this.Audio.addEventListener('ended', function () {
                t.IsPlaying = false;
            }, false);
        }
        this.Audio.play();
    }

    //暂停
    this.Pause = function () {
        this.Audio.pause();
        this.IsPlaying = false;
    }

    //停止
    this.Stop = function () {
        this.Audio.pause();
        this.Audio.currentTime = 0;
        this.IsPlaying = false;
    }
}


/***************************************
 *  画图像
 ***************************************/
var Bitmap = function (file) {
    //对象类型
    this.Type = "Bitmap";

    //载入图像
    this.image = new Image();
    this.image.src = file;

    var t = this;
    this.image.onload = function () {
        Game.LoadedObjectsCount++;
        if (t.Size == null) {
            t.Size = new Size(this.width, this.height);
        }
    }

    //设置图片
    this.SetImage = function (url) {
        this.StartPoint = new Point(0, 0);
        this.image.src = url;
    }

    //层次优先级
    this.ZIndex = 0;

    //对象位置
    this.Position = new Point(0, 0);

    //开始切割位置
    this.StartPoint = new Point(0, 0);

    //对象大小
    this.Size = null;

    //加入精灵库中
    Game.SpriteArray.push(this);
    Game.NeedLoadObjectsCount++;

    //对象结束位置
    this.EndPosition = function () {
        var point = new Point();
        if (this.Size != null) {
            point.X = this.Position.X + this.Size.Width;
            point.Y = this.Position.Y + this.Size.Height;
        }
        else {
            point.X = this.Position.X + this.image.width;
            point.Y = this.Position.Y + this.image.height;
        }
        return point;
    }

    //设置位置
    this.Show = function (context) {
        if (this.Size == null) {
            context.drawImage(this.image, this.Position.X, this.Position.Y);
        }
        else {
            context.drawImage(this.image, this.StartPoint.X, this.StartPoint.Y, this.Size.Width, this.Size.Height, this.Position.X, this.Position.Y, this.Size.Width, this.Size.Height);
        }
    }

    this.Visible = true;

    //销毁对象
    this.Dispose = function () {
        this.Visible = false;
    }

    //点击事件
    this.Click = null;

    //拖拽事件
    this.Drag = null;
}

//Point位置对象
var Point = function (x, y) {

    //X轴坐标
    this.X = x;

    //Y轴坐标
    this.Y = y;
}

//元素大小对象
var Size = function (width, height) {

    //宽度
    this.Width = width;

    //高度
    this.Height = height;
}

//生成随即ID
function randonID() {
    var guid = '';
    for (var i = 1; i <= 32; i++) {
        var n = Math.floor(Math.random() * 16.0).toString(16);
        guid += n;
    }
    return guid;
}

//判断坐标是否在指定坐标范围内
function CheckInSprite(startpoint, endpoint, point) {
    return point.X >= startpoint.X && point.X <= endpoint.X && point.Y >= startpoint.Y && point.Y <= endpoint.Y;
}

String.prototype.replaceAll = function (reallyDo, replaceWith, ignoreCase) {
    if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
        return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi" : "g")), replaceWith);
    } else {
        return this.replace(reallyDo, replaceWith);
    }
}

/***************************************
 *  文字
 ***************************************/
var Label = function (str) {
    //对象类型
    this.Type = "Text";

    this.Text = str;

    //层次优先级
    this.ZIndex = 0;

    //对象位置
    this.Position = new Point(0, 0);

    //阴影延伸的距离 x
    this.ShadowX = null;

    //阴影延伸的距离 y
    this.ShadowY = null;

    //阴影模糊度
    this.ShadowBlur = null;

    //阴影颜色和透明度
    this.ShadowColor = null;

    //字体颜色
    this.Color = null;

    this.Font = null;  //"30px Arial";

    //加入精灵库中
    Game.SpriteArray.push(this);

    //设置位置
    this.Show = function (context) {
        if (this.ShadowX != null) {
            context.shadowOffsetX = this.ShadowX;
        }

        if (this.ShadowY != null) {
            context.shadowOffsetY = this.ShadowY;
        }

        if (this.ShadowBlur != null) {
            //阴影的模糊程度
            context.shadowBlur = this.ShadowBlur;
        }

        if (this.ShadowColor != null) {
            context.shadowColor = this.ShadowColor;
        }

        if (this.Font != null) {
            context.font = this.Font;
        }
        if (this.Color != null) {
            context.fillStyle = this.Color;
        }
        //文字，x轴坐标,y轴坐标
        context.fillText(this.Text, this.Position.X, this.Position.Y);
    }

    this.Visible = true;

    //销毁对象
    this.Dispose = function () {
        this.Visible = false;
    }

    //点击事件
    this.Click = null;

    //拖拽事件
    this.Drag = null;
}


//系统线程
var Thread;
Thread = function (callback, timeout, param) {
    var args = Array.prototype.slice.call(arguments, 2);
    var _cb = function () {
        callback.apply(null, args);
    }

    var threadID = 0;

    //启动线程
    this.Start = function () {
        threadID = setInterval(_cb, timeout);
    }

    //停止线程
    this.Stop = function () {
        clearInterval(threadID);
    }
};
