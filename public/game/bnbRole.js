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
    
    this.Object.ZIndex = 3;                    // 初始渲染层级
    this.IsDeath = false;                      // 是否死亡
    this.Offset = new Size(0, 0);              // 绘制偏移（用于骑乘等）
    this.RawOffset = null;                     // 原始偏移备份
    this.Direction = Direction.Down;           // 当前方向（默认向下）
    this.RawSpeed = 0;                         // 原始速度（步长）
    this.MoveStep = 1;                         // 当前移动步长（像素/20ms）
    this.MoveHorse = MoveHorseObject.None;     // 骑乘类型（None/Owl/Turtle/UFO）
    this.IsCanMovePaopao = false;              // 是否可以踢泡泡
    this.CanPaopaoLength = 1;                  // 可同时放置的泡泡数量
    this.PaopaoCount = 0;                      // 当前已放置且未炸的泡泡数
    this.PaopaoStrong = 1;                     // 泡泡爆炸强度（范围格子数）
    this.IsInPaopao = false;                   // 是否被困在泡泡中
    this.RideHorseObject = null;               // 骑乘对象实例
    this.RideSize = null;                      // 骑乘时的角色尺寸
    this.RawSize = null;                       // 原始尺寸备份
    this.AniSize = null;                       // 被困泡泡时的动画尺寸
    this.DieSize = null;                       // 死亡动画尺寸
    this.PushCount = 0;                        // 用于推箱子蓄力，避免一碰就推动
    this.LastDirection = 0;                    // 记录上一次的方向，用于推箱子判断
    // ========== 踢泡泡蓄力相关 ==========
    this.KickCount = 0;                        // 用于踢泡泡蓄力，避免一碰就踢
    this.LastKickDirection = 0;                // 记录上一次的方向，用于踢泡泡判断
    // =================================
    
    // 设置原始速度（同时重置当前步长）
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
                    if (t.IsCanPass(new Point(roleActualPoint.X, roleActualPoint.Y - t.MoveStep - 19.99))) {
                        t.Object.Position.Y -= t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Down:
                    if (t.IsCanPass(new Point(roleActualPoint.X, roleActualPoint.Y + t.MoveStep + 19.99))) {
                        t.Object.Position.Y += t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Left:
                    if (t.IsCanPass(new Point(roleActualPoint.X - t.MoveStep - 19.99 , roleActualPoint.Y))) {
                        t.Object.Position.X -= t.MoveStep;
                        t.RoleOffset();
                        if (t.RideHorseObject != null) {
                            t.RideHorseObject.ResetPosition(t);
                        }
                    }
                    break;
                case Direction.Right:
                    if (t.IsCanPass(new Point(roleActualPoint.X + t.MoveStep + 19.99, roleActualPoint.Y))) {
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
        this.RawSpeed += addNum;
        if (this.RawSpeed > RoleConstant.MaxMoveStep) {
            this.RawSpeed = RoleConstant.MaxMoveStep;
        }
        if(this.MoveHorse == MoveHorseObject.None){
            this.MoveStep = this.RawSpeed;
        }
        //console.log("[bnbRole.js] [" + this.RoleNumber + "] AddMoveStep -> 新步长=" + this.MoveStep);
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

    // ======================== 推箱子相关方法 ========================
    /**
     * 尝试推动箱子
     * @param {number} boxX 箱子当前X索引
     * @param {number} boxY 箱子当前Y索引
     * @param {number} direction 推动方向（使用 Direction 常量）
     * @returns {boolean} 是否成功推动
     */
    this.tryPushBox = function(boxX, boxY, direction) {
        // 增加推箱子的难度，不然碰一下就动了
        if(direction === this.LastDirection){
            if(this.PushCount<50){     //防呆，防止玩家一直摁一个方向，导致计数归零越界
                this.PushCount++;
            }
        }else{
            this.PushCount = 0;
        }
        this.LastDirection = direction;
        if (this.PushCount < 10)
        {
            return false;
        }
        //增加推箱子的难度，不然碰一下就动了

        var pushX = boxX, pushY = boxY;
        switch(direction) {
            case Direction.Up:    pushY--; break;
            case Direction.Down:  pushY++; break;
            case Direction.Left:  pushX--; break;
            case Direction.Right: pushX++; break;
        }

        // 边界检查
        if(pushX < 0 || pushX >= 15 || pushY < 0 || pushY >= 13) {
            return false;
        }

        // ========== 修改点：目标格子是否为礼物（>100） ==========
        var targetVal = townBarrierMap[pushY][pushX];
        if (targetVal > 100) {
            // 目标位置有礼物，先销毁礼物（相当于被箱子覆盖）
            if (Barrier.Storage[pushY] && Barrier.Storage[pushY][pushX]) {
                Barrier.Storage[pushY][pushX].Object.Dispose();
                Barrier.Storage[pushY][pushX] = null;
            }
            townBarrierMap[pushY][pushX] = 0;  // 清空礼物格子
            // 继续执行下方箱子移动逻辑（此时目标格子已变为空地）
        }
        else if (targetVal !== 0) {
            return false;
        }
        // ========================================================

        // 检查是否有其他角色站在目标格子上
        for(var i=0; i<RoleStorage.length; i++) {
            var r = RoleStorage[i];
            if(!r.IsDeath) {
                var pos = r.CurrentMapID();
                if(pos && pos.X === pushX && pos.Y === pushY) {
                    return false;
                }
            }
        }

        // 执行推动：更新地图数组
        townBarrierMap[boxY][boxX] = 0;
        townBarrierMap[pushY][pushX] = 3;

        // 移除原位置的箱子图形
        if(Barrier.Storage[boxY] && Barrier.Storage[boxY][boxX]) {
            Barrier.Storage[boxY][boxX].Object.Dispose();
            Barrier.Storage[boxY][boxX] = null;
        }

        // 在新位置创建箱子图形
        var newBox = Barrier.Create(pushX, pushY, 3);
        if(newBox && newBox.Object) {
            newBox.Object.ZIndex = pushY * 2 + 1;
        } else {
        }
        return true;
    };

    // ======================== 踢泡泡相关方法 ========================
    /**
     * 尝试踢动前方的泡泡（仿照推箱子，支持连续移动直到障碍物）
     * @param {number} bubbleX 泡泡当前X索引
     * @param {number} bubbleY 泡泡当前Y索引
     * @param {number} direction 踢动方向
     * @returns {boolean} 是否成功踢动
     */
    this.tryKickPaopao = function(bubbleX, bubbleY, direction) {
        //console.group("[bnbRole.js] [" + this.RoleNumber + "] ⚽ 尝试踢泡泡");
        //console.log("[bnbRole.js] 泡泡初始位置: (" + bubbleX + ", " + bubbleY + "), 地图值: " + townBarrierMap[bubbleY][bubbleX]);
        
        // 只有具备踢泡泡能力的角色才能踢
        if (!this.IsCanMovePaopao) {
            //console.log("[bnbRole.js] ❌ 踢泡泡失败: 角色没有踢泡泡能力（需道具106）");
            //console.groupEnd();
            return false;
        }

        if (this.MoveHorse != MoveHorseObject.None) {
            //console.log("[bnbRole.js] ❌ 踢泡泡失败: 角色骑在动物上面不能踢");
            //console.groupEnd();
            return false;
        }
        // 增加踢泡泡的蓄力，避免一碰就踢（仿推箱子）
        if(direction === this.LastKickDirection){
            if(this.KickCount < 50){
                this.KickCount++;
            }
        } else {
            this.KickCount = 0;
        }
        this.LastKickDirection = direction;
        //console.log("[bnbRole.js] 角色方向: " + this.LastKickDirection + "， 踢泡泡计数: " + this.KickCount);
        if (this.KickCount < 10) {
            //console.groupEnd();
            return false;
        }
        //console.groupEnd();
        // 计算踢动方向上的最远可移动位置（连续穿透空地0和道具>100）
        var step = 1;
        var maxSteps = 20; // 地图最大尺寸15x13
        var targetX = bubbleX, targetY = bubbleY;
        var lastValidX = bubbleX, lastValidY = bubbleY;
        var foundObstacle = false;
        
        while (step <= maxSteps) {
            var nextX = bubbleX, nextY = bubbleY;
            switch(direction) {
                case Direction.Up:    nextY = bubbleY - step; break;
                case Direction.Down:  nextY = bubbleY + step; break;
                case Direction.Left:  nextX = bubbleX - step; break;
                case Direction.Right: nextX = bubbleX + step; break;
            }
            // 边界检查
            if (nextX < 0 || nextX >= 15 || nextY < 0 || nextY >= 13) {
                //console.log("[bnbRole.js] 踢泡泡 遇到边界，停止于 (" + lastValidX + "," + lastValidY + ")");
                targetX = lastValidX;
                targetY = lastValidY;
                foundObstacle = true;
                break;
            }
            var cell = townBarrierMap[nextY][nextX];
            // 可通行条件：空地0 或 道具>100
            var isPassable = (cell === 0 || cell > 100);
            if (!isPassable) {
                // 遇到障碍物（墙壁、箱子、其他泡泡等），停止在前一个位置
                //console.log("[bnbRole.js] 踢泡泡 遇到障碍物 值=" + cell + "，停止于 (" + lastValidX + "," + lastValidY + ")");
                targetX = lastValidX;
                targetY = lastValidY;
                foundObstacle = true;
                break;
            }
            // 检查是否有其他角色站在目标格子上
            var hasRole = false;
            for (var i = 0; i < RoleStorage.length; i++) {
                var r = RoleStorage[i];
                if (!r.IsDeath) {
                    var pos = r.CurrentMapID();
                    if (pos && pos.X === nextX && pos.Y === nextY) {
                        hasRole = true;
                        break;
                    }
                }
            }
            if (hasRole) {
                console.log("[bnbRole.js] 踢泡泡 遇到其他角色，停止于 (" + lastValidX + "," + lastValidY + ")");
                targetX = lastValidX;
                targetY = lastValidY;
                foundObstacle = true;
                break;
            }
            // 当前格子可通行，更新最后有效位置
            lastValidX = nextX;
            lastValidY = nextY;
            step++;
        }
        if((bubbleX == targetX) && (bubbleY == targetY)){     //解决泡泡已经在边缘的位置但是仍能被踢动的问题
            return false;
        }
        //console.log("[bnbRole.js] 踢泡泡 遇到其他角色，停止于 (" + lastValidX + "," + lastValidY + ")");
        PaopaoOwner = PaopaoArray[Math.floor(bubbleY)][bubbleX].Master;
        //console.log("[bnbRole.js] 踢泡泡  PaopaoOwner (" + PaopaoOwner.RoleNumber + ")");
        PaopaoArray[Math.floor(bubbleY)][bubbleX].Clear();
        if(townBarrierMap[lastValidY][lastValidX] > 100){
            if (Barrier.Storage[lastValidY] && Barrier.Storage[lastValidY][lastValidX]) {
                Barrier.Storage[lastValidY][lastValidX].Object.Dispose();
                townBarrierMap[lastValidY][lastValidX] = 0;
                Barrier.Storage[lastValidY][lastValidX] = 0;
            }
        }
        //PaopaoArray[targetY][targetX] = this;
        new KickPaopao(PaopaoOwner, targetY, targetX);
        //return true;
        
        //console.groupEnd();
        // 踢动成功后重置蓄力计数
        this.KickCount = 0;
        return true;
    };

    // 核心碰撞检测：判断屏幕某点是否可进入（已增加推箱子和踢泡泡逻辑）
    this.IsCanPass = function(point) {
        //去掉边框的像素
        var nextmap = FindMapID(point);

        // 边界检查
        if (point.X >= 0 && point.Y >= 0 && point.X <= 600 && point.Y <= 520) { //这里增加了等于600和 520的
            var currentMapID = this.CurrentMapID();
            
            if(townBarrierMap[nextmap.Y][nextmap.X] == 100 && currentMapID.X == nextmap.X && currentMapID.Y == nextmap.Y){
                return true;
            }
            // 计算角色中心点相对于当前格子中心的偏移（格子大小40x40，中心在(20,20)）
            var centerX = currentMapID.X * 40 + 20;
            var centerY = currentMapID.Y * 40 + 20;
            var mp = this.MapPoint();    // MapPoint是角色中心点的位置，而CenterPoint不是，反而横坐标大半个格子，纵坐标大一个格子
            var dx = mp.X - centerX;   // 范围 -20 ~ 20
            var dy = mp.Y - centerY;

            // 判断是否已到达当前格子边缘（阈值改为0像素，确保角色贴紧才触发,预留，以后可以调整）
            var edgeThreshold = 0;   // 小于0像素时认为已触碰边缘，虽然都是0，但是先保留
            var isAtEdge = false;
            switch(this.Direction) {
                case Direction.Up:    isAtEdge = (dy <= -edgeThreshold); break;
                case Direction.Down:  isAtEdge = (dy >= edgeThreshold);  break;
                case Direction.Left:  isAtEdge = (dx <= -edgeThreshold); break;
                case Direction.Right: isAtEdge = (dx >= edgeThreshold);  break;
            }

            // 计算前方格子坐标
            var frontX = currentMapID.X, frontY = currentMapID.Y;
            switch(this.Direction){
                case Direction.Up:    frontY--; break;
                case Direction.Down:  frontY++; break;
                case Direction.Left:  frontX--; break;
                case Direction.Right: frontX++; break;
            }
            //console.log("[bnbRole.js]    前方格子: (" + frontX + ", " + frontY + ")");
            
            // ========== 踢泡泡逻辑：检测前方是否是泡泡 ==========
            if(frontX>=0 && frontX<15 && frontY>=0 && frontY<13 && townBarrierMap[frontY][frontX] === 100 && !(currentMapID.X === frontX && currentMapID.Y === frontY)){
                //console.log("[bnbRole.js] [" + this.RoleNumber + "] 🫧 踢泡泡 检测到前方泡泡 (" + frontX + "," + frontY + "), isAtEdge=" + isAtEdge);
                if(isAtEdge) {
                    // 角色已触碰到泡泡，尝试踢动
                    if(this.tryKickPaopao(frontX, frontY, this.Direction)){
                        // 踢动成功，角色可以进入原泡泡位置（原位置已变为0）
                        //console.log("[bnbRole.js] [" + this.RoleNumber + "] 踢泡泡成功，角色可以进入原泡泡位置");
                        return true;
                    } else {
                        // 踢动失败，不能进入泡泡格子
                        //console.log("[bnbRole.js] [" + this.RoleNumber + "] 踢泡泡失败，不能进入泡泡格子");
                        return false;
                    }
                } else {
                    // 尚未触碰到泡泡，允许角色继续向泡泡移动
                    //console.log("[bnbRole.js] [" + this.RoleNumber + "] 踢泡泡 尚未贴紧泡泡，允许继续移动");
                    return true;
                }
            }
            
            // ========== 推箱子逻辑：检测前方是否是箱子 ==========
            if(frontX>=0 && frontX<15 && frontY>=0 && frontY<13 && townBarrierMap[frontY][frontX] === 3){
                if(isAtEdge) {
                    // 角色已触碰到箱子，尝试推动
                    if(this.tryPushBox(frontX, frontY, this.Direction)){
                        // 推动成功，角色可以进入原箱子位置（原箱子位置已变为0）
                        this.PushCount = 0; //箱子推动成功后，推动的蓄力要重新计数
                        return true;
                    }
                } else {
                    // 尚未触碰到箱子，允许角色继续向箱子移动
                    return true;
                }
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
                    var currentVal = townBarrierMap[currentMapID.Y][currentMapID.X];
                    if (currentVal > 100) {
                        //console.log("[bnbRole.js] [" + this.RoleNumber + "] 拾取道具 值=" + currentVal);
                        SystemSound.Play(SoundType.Get);
                        if (Barrier.Storage[currentMapID.Y] && Barrier.Storage[currentMapID.Y][currentMapID.X]) {
                            Barrier.Storage[currentMapID.Y][currentMapID.X].Object.Dispose();
                        }
                        switch (currentVal) {
                            case 101: this.CanPaopaoLength++; break;  //泡泡
                            case 102: this.AddMoveStep(1); break;     //鞋子
                            case 103: this.AddPaopaoStrong(1); break; //药水
                            case 104: this.AddPaopaoStrong(RoleConstant.MaxPaopaoStrong); break; //最大威力
                            case 105: this.AddMoveStep(8); this.IsCanMovePaopao = true; break;  //红牛
                            case 106: this.IsCanMovePaopao = true; break;  //球鞋
                            case 107: if(this.MoveHorse == MoveHorseObject.None){this.MoveStep = MoveHorseObject.Owl.MoveStep; this.MoveHorse = MoveHorseObject.Owl; this.Ride()}; break; //小鸟
                            case 108: if(this.MoveHorse == MoveHorseObject.None){this.MoveStep = MoveHorseObject.Turtle.MoveStep; this.MoveHorse = MoveHorseObject.Turtle; this.Ride()}; break; //海盗乌龟
                            case 109: if(this.MoveHorse == MoveHorseObject.None){this.MoveStep = MoveHorseObject.UFO.MoveStep; this.MoveHorse = MoveHorseObject.UFO; this.Ride(); break};  //飞碟
                            case 110: if(this.MoveHorse == MoveHorseObject.None){this.MoveStep = MoveHorseObject.SlowTurtle.MoveStep; this.MoveHorse = MoveHorseObject.SlowTurtle; this.Ride()}; break; //慢乌龟
                        }
                        townBarrierMap[currentMapID.Y][currentMapID.X] = 0;
                        //吃掉宝物后，障碍物混存标记Barrier也要清零
                        Barrier.Storage[currentMapID.Y][currentMapID.X] = 0;
                        //吃掉宝物后，障碍物混存标记Barrier也要清零
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
    if (x >= 0 && y >= 0 && x <= 600 && y <= 520) { //增加了等于600 和 520
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
            case MoveHorseObject.Owl: this.Offset.Height = this.MoveHorse.Size.Height - 10; break;
            case MoveHorseObject.Turtle: this.Offset.Height = this.MoveHorse.Size.Height; break;
            case MoveHorseObject.UFO: this.Offset.Height = this.MoveHorse.Size.Height; break;
            case MoveHorseObject.SlowTurtle: this.Offset.Height = this.MoveHorse.Size.Height; break;
        }
        //this.ResetPosition();
        this.RideHorseObject.ResetPosition(this);
    }
}

//坐骑被炸死
Role.prototype.OutRide = function(){
    if(this.MoveHorse != MoveHorseObject.None){
        // 1. 停止移动和动画
        this.Stop();

        // 2. 保存骑乘时的中心点（此时角色还在骑乘状态）
        var oldCenter = this.CenterPoint();

        // 3. 恢复原始尺寸和偏移
        this.Object.Size = new Size(this.RawSize.Width, this.RawSize.Height);
        this.Offset = new Size(this.RawOffset.Width, this.RawOffset.Height);
        this.MoveHorse =  MoveHorseObject.None;
        this.MoveStep = this.RawSpeed;
        this.Object.SetImage(resPrefix + "Pic/Role" + this.RoleNumber + ".png");

        // 5. 恢复方向对应的起始帧（关键：防止方向变成向上）
        this.Object.StartPoint = new Point(0, this.Object.Size.Height * this.Direction);

        // 6. 通过坐骑对象调整角色位置（传入保存的中心点）
        if (this.RideHorseObject) {
            this.RideHorseObject.AdjustRoleOnDismount(this, oldCenter);
            this.RideHorseObject.Die();
            this.RideHorseObject = null;
        }

        //console.log("[bnbRole.js] [" + this.RoleNumber + "] 下坐骑，方向已恢复为 " + this.Direction);
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
