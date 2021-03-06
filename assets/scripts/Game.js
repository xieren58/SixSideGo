cc.Class({
    extends: cc.Component,

    properties: {
        overLabel: {
            default: null,
            type: cc.Label
        },
        lastChessTag: {
            default: null,
            type: cc.Node
        },
        chessPrefabA: {
            default: null,
            type: cc.Prefab
        },
        chessPrefabB: {
            default: null,
            type: cc.Prefab
        },
        nullSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        nullSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        redSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        redSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        blueSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        blueSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        UI1: {
            default: null,
            type: cc.Node
        },
        danji: {
            default: true,
            displayName: "是否单机"
        },
        touchChess: {  // 每一回合落下的棋子
            default: null,
            type: cc.Node,
            visible: false  // 属性窗口不显示
        },
        audioButton: {
            type: cc.AudioSource,
            default: null
        },
        audioChessDown: {
            type: cc.AudioSource,
            default: null
        },
        audioChessDead: {
            type: cc.AudioSource,
            default: null
        },
        audioGameOver: {
            type: cc.AudioSource,
            default: null
        },
        dBorderX: {
            default: 30
        },
        dBorderY: {
            default: 10
        },
        w: {
            default: 30,
            displayName: "小六边形的边长"
        }
    },

    // 初始化游戏参数
    initializeParams() {
        this.strOver = '';
        this.seconds = 0;
        this.size = 13; // 棋盘边长与小六边形边长的比值
        this.maxY = 18; // 行数
        this.maxX = 27; // 列数
        this.overLabel.string = '';
        this.labelDaoJiShi.string = '' + this.daojishi;
        this.UiDaoJiShi.color = new cc.Color(0, 125, 255);
        this.jie = {  // 记录劫点
            red: null,
            blue: null,
            tag: 0
        };
        this.ting = {  // 记录停一手
            red: false,
            blue: false
        };
        this.gameState = 'blue';
        this.recordList = []; // 行棋记录
        this.recordDead = []; // 提子记录
        this.recordJie = [];  // 劫点记录
    },

    // 调整画面宽高
    resize() {
        var cvs = cc.find('Canvas').getComponent(cc.Canvas);
        this.curDR = cc.view.getFrameSize();  // 在 native 平台下，它返回全屏视图下屏幕的尺寸
        var s = this.curDR;
        var rw = s.width, rh = s.height;
        var finalW, finalH;
        console.log("view size: ", rw, rh);

        // console.log("---- cc.view.getFrameSize() ----");
        // console.log("rw =", rw);
        // console.log("rh =", rh);

        if ((rw / rh) > 0.25 * Math.sqrt(3)) {
            // 如果更长，则用定高
            finalH = s.height;
            finalW = finalH * rw / rh;
            this.w0 = finalH;
        }
        else {
            // 如果更短，则用定宽
            finalW = s.width;
            finalH = rh / rw * finalW;
            this.w0 = finalW;
        }
        console.log("w0 = ", this.w0);
        cvs.designResolution = cc.size(finalW, finalH);
        this.curDR = cvs.designResolution;  // Canvas调整后的设计分辨率

        // console.log("---- cvs.designResoluntion2 ----");
        // console.log("w =", finalW);
        // console.log("h =", finalH);
        // //cvs.node.emit('resize');
    },

    // 求 chess 左方的落子点
    leftOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (tagNum == 352)
            return this.chessList[324];
        else if (tagNum == 109)
            return this.chessList[135];
        var chess;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 1)
                chess = this.chessList[y * this.maxX - this.maxX + x - 2];
            else if (chess0.tagBorder == 2)
                chess = this.chessList[y * this.maxX + this.maxX + x];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 2)
                chess = this.chessList[y * this.maxX - this.maxX + x];
            else if (chess0.tagBorder == 3)
                chess = this.chessList[y * this.maxX + this.maxX + x - 2];
        }
        if (chess === undefined) chess = this.chessList[tagNum - 1];
        if (chess === 'midX') {  // chess 为顶端或低端角上的点
            return this.chessList[tagNum - 2];
        }
        return chess;
    },

    // 求 chess 右方的落子点
    rightOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (tagNum == 376)
            return this.chessList[350];
        else if (tagNum == 133)
            return this.chessList[161];
        var chess;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 5)
                chess = this.chessList[y * this.maxX + this.maxX + x];
            else if (chess0.tagBorder == 6)
                chess = this.chessList[y * this.maxX - this.maxX + x + 2];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 4)
                chess = this.chessList[y * this.maxX + this.maxX + x + 2];
            else if (chess0.tagBorder == 5)
                chess = this.chessList[y * this.maxX - this.maxX + x];
        }
        if (chess === undefined) chess = this.chessList[tagNum + 1];
        if (chess === 'midX') {  // chess 为顶端或低端角上的点
            return this.chessList[tagNum + 2];
        } else return chess;
    },

    // 求 chess 上方或下方的落子点
    upDownOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (tagNum == 324)
            return this.chessList[352];
        else if (tagNum == 135)
            return this.chessList[109];
        else if (tagNum == 350)
            return this.chessList[376];
        else if (tagNum == 161)
            return this.chessList[133];
        var chess;
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 3)
                chess = this.chessList[y * this.maxX - this.maxX + x + 2];
            else if (chess0.tagBorder == 4)
                chess = this.chessList[y * this.maxX - this.maxX + x - 2];
            else chess = this.chessList[y * this.maxX - this.maxX + x];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 1)
                chess = this.chessList[y * this.maxX + this.maxX + x + 2];
            else if (chess0.tagBorder == 6)
                chess = this.chessList[y * this.maxX + this.maxX + x - 2];
            else chess = this.chessList[y * this.maxX + this.maxX + x];
        }
        return chess;
    },

    // 判断指定的chessList索引对应的落子点，是否处于棋盘内
    // putInList: 对于每个棋盘外的落子点，把 null 加入 chessList 数组
    // todo: 目前针对 size=13 的场景，将6个角上的点排除在外，4、13等数字都是固定的。需要增加通用的判断方法。
    isInBoard(x, y, putInList) {
        var ok = false;
        this.tagBorder = 0;
        if (y <= 4) {
            let leftX = 12 - 3 * y,
                rightX = 14 + 3 * y;
            if (x >= leftX && x <= rightX) {
                if (putInList === true) {
                    if (x == leftX || x == leftX + 1) this.tagBorder = 3;
                    else if (x == rightX || x == rightX - 1) this.tagBorder = 4;
                }
                ok = true;
            }
        }
        else if (y >= 13) {
            let leftX = 3 * y - 39,
                rightX = 65 - 3 * y;
            if (x >= leftX && x <= rightX) {
                if (putInList === true) {
                    if (x == leftX || x == leftX + 1) this.tagBorder = 1;
                    else if (x == rightX || x == rightX - 1) this.tagBorder = 6;
                }
                ok = true;
            }
        }
        else ok = true;
        // 将6个角上的点排除
        if ((y == 0 || y == 17) && x == 13) {
            if (putInList === true)
                this.chessList.push('midX');
            return false;
        }
        else if (x == 0 && (y == 13 || y == 4)) {
            if (putInList === true)
                this.chessList.push('leftX');
            return false;
        }
        else if (x == 26 && (y == 13 || y == 4)) {
            if (putInList === true)
                this.chessList.push('rightX');
            return false;
        }
        if (!ok && putInList === true) this.chessList.push(null);
        return ok;
    },

    // 判断是否可以落子
    canPutChess(color, chess) {
        if (arguments.length >= 2) {
            var self = chess;
        }
        else {
            var self = this.touchChess;
            if (self.tagColor != 'null')
                return false;
            this.listTagNum = new Array();
        }
        var tagNum = self.tagNum,
            tagColor = self.tagColor,
            list = this.listTagNum;
        // 当 self 没有归入 list
        if (list.indexOf(tagNum) == -1) {
            // 当 self 的颜色不同于当前执行判断的颜色
            if (tagColor != color && arguments.length >= 2) {
                if (tagColor == 'null')
                    return true;
                else return false;
            }
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX),
                b1 = true, b2 = true, b3 = true;
            // 将 self 归入 list
            list.push(tagNum);
            // 判断三个方向
            b1 = this.canPutChess(color, this.upDownOf(self, x, y));
            b2 = this.canPutChess(color, this.leftOf(self, x, y));
            b3 = this.canPutChess(color, this.rightOf(self, x, y));
            if (!b1 && !b2 && !b3)
                return false;
            else return true;
        }
        else return false;
    },

    // 判断 chess 及其周围同色棋子的死活。tiZou 表示死子是否提走。
    judgeDead(chess, color, tiZou) {
        if (chess.tagColor != color) {
            if (chess.tagColor == 'null')
                return true;
            else {
                this.jie.tag -= 2;  // 劫的标记-2
                return false;
            }
        }
        this.listTagNum = new Array();
        var isAlive = this.canPutChess(color, chess);
        if (!isAlive && tiZou) {
            this.removeDead(color);
        }
        return !isAlive;
    },

    // 提死子，死子储存在 this.listTagNum 中
    removeDead(color) {
        let len = this.listTagNum.length;
        if (len > 0) {
            this.audioChessDead.play();
            for (var i = 0; i < len; i++) {
                let chess = this.chessList[this.listTagNum[i]];
                this.setChess(chess, 'null');
            }
            // 记录提子信息
            let recordId = this.recordList.length,
                lastIdOfDead = this.recordDead.length - 1;
            // 如果提子记录的最后一项的 id 属性正好是当前的 行棋序号(recordId)，说明提子超过一处
            if (this.recordDead[lastIdOfDead] && this.recordDead[lastIdOfDead].id === recordId) {
                for (i = 0; i < len; ++i)
                    this.recordDead[lastIdOfDead].list.push(this.listTagNum[i]);
            } else {
                this.recordDead.push({
                    id: recordId,
                    list: this.listTagNum
                });
            }
            if (len == 1) {
                this.jie.tag += 1;  // 劫的标记+1
                this.jie[color] = this.listTagNum[0]; // 设置 color 的劫点位置
            }
        }
    },

    // 根据 str 指示的颜色设置 chess 节点的图片
    setChess(chess, str) {
        if (!chess)
            return;
        if (!str) {
            str = chess.tagColor;
        } else if (chess.tagColor != str) {
            chess.tagColor = str;
        }
        if (str === 'null') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameB;
            }
            chess.tagColor = str;
        } else if (str === 'red') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameB;
            }
        } else if (str === 'blue') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameB;
            }
        }
    },

    // 点击某落子点 的回调函数
    onTouchChess(event) {
        var self = event.currentTarget;
        if (self.tagColor != 'null')
            return;
        // 考察是否为劫点
        if (self.tagNum == this.jie[this.gameState])
            return;
        // 考察周围是否可以提子（直接提走）
        var fanState = this.fanState();
        self.tagColor = this.gameState;
        var b1 = this.judgeDead(this.upDownOf(self), fanState, true),
            b2 = this.judgeDead(this.leftOf(self), fanState, true),
            b3 = this.judgeDead(this.rightOf(self), fanState, true);
        if (b1 || b2 || b3) {
            // 如果提掉了对手的不止一个劫点，该劫点就不成立
            if (this.jie.tag != 1)
                this.jie[fanState] = null;
            // 清零劫点标记
            this.jie.tag = 0;
            this.putChess(self);
        } else {
            this.touchChess = self;
            self.tagColor = 'null';
            if (this.canPutChess(this.gameState))
                this.putChess(self);
        }
    },

    // 落子
    putChess(self) {
        this.audioChessDown.play();
        self.tagColor = this.gameState;
        this.setChess(self, this.gameState);
        // 标记最后一步棋
        this.lastChessTag.setPosition(self.x, self.y)
        // 记录劫点信息
        if (this.jie[this.gameState] != null) {
            this.recordJie.push({
                id: this.recordList.length,
                tagNum: this.jie[this.gameState],
                color: this.gameState
            });
        }
        // 记录行棋位置
        this.recordList.push(self.tagNum);
        this.changeGameState();
    },

    // 进入下一轮
    changeGameState() {
        this.jie[this.gameState] = null;  // 劫点清除
        if (this.gameState == 'red') {
            this.UiDaoJiShi.color = new cc.Color(0, 125, 255);
            this.gameState = 'blue';
        }
        else {
            this.UiDaoJiShi.color = new cc.Color(255, 25, 0);
            this.gameState = 'red'
        }
        if (this.ting[this.gameState])
            this.ting[this.gameState] = false;  // 停一手记号清除
        this.labelDaoJiShi.string = "" + this.daojishi;
        this.seconds = 0;
    },

    fanState() {
        if (this.gameState == 'red')
            return 'blue';
        else
            return 'red';
    },

    // 根据落子点在chessList中的索引值，计算落子点的物理坐标
    ccV2ById(x, y, dx, dy) {
        var w = this.w,
            cx = dx || this.dBorderX,
            cy = dy || this.dBorderY,
            xx = Math.sqrt(3) * 0.5 * w * x + cx,
            yy = 1.5 * w * y + cy;
        return cc.v2(xx, yy);
    },

    onLoad() {
        this.daojishi = Global.timePerState;
        this.UiDaoJiShi = this.UI1.getChildByName("DaoJiShi");
        this.labelDaoJiShi = this.UiDaoJiShi.getComponent(cc.Label);
        this.initializeParams();
        this.resize();
        var self = this,
            sqrt3 = Math.sqrt(3),
            boardZhanBi = 0.02; // 棋盘宽度占画面宽度的比例
        // if (this.w0 == this.curDR.width) {
        //     this.w0 = this.w0 * boardZhanBi;
        //     this.dBorderX = 0.5 * (this.curDR.width - this.w0);
        //     this.w0 = this.w0 / sqrt3;
        //     this.dBorderY = 0.5 * this.curDR.height - this.w0;
        //     this.w = this.w0 / this.size;
        // } else {
        //     this.w0 = this.w0 * boardZhanBi;
        //     console.log("w0 = ", this.w0);
        //     this.dBorderY = 0.5 * (this.curDR.height - this.w0);
        //     this.w = this.w0 * 2 / this.size;
        //     this.w0 = this.w0 * sqrt3 * 0.5;
        //     this.dBorderX = 0.5 * (this.curDR.width - this.w0);
        // }
        var scaleNode = this.w / 200,
            dx = this.dBorderX,
            dy = this.dBorderY;

        // 调整棋盘边界的位置
        var borderW = this.size * this.w;
        // 落子点格子与边界的错位修正值

        // 设置 UI 的位置等
        // var yUi = (this.curDR.height + borderW) * 0.33333;
        // this.UI1.setPosition(0, -yUi);
        this.labelDaoJiShi.string = "" + this.daojishi;

        // 初始化棋盘上的点，并为每个节点添加事件
        this.chessList = new Array();
        for (var y = 0; y < this.maxY; y++) {
            for (var x = 0; x < this.maxX; x++) {
                if (this.isInBoard(x, y, true)) {
                    // 添加落子点（cc_Node类型）
                    var newNode;
                    if ((x + y) % 2 == 0) {
                        newNode = cc.instantiate(this.chessPrefabB);
                        newNode.tagType = 'B';
                    } else {
                        newNode = cc.instantiate(this.chessPrefabA);
                        newNode.tagType = 'A';
                    }
                    newNode.setScale(scaleNode);  // 缩放到合适大小
                    this.node.addChild(newNode);
                    this.chessList.push(newNode);
                    newNode.setPosition(this.ccV2ById(x, y, dx, dy));  // 使每个节点位于指定位置
                    newNode.tagNum = this.maxX * y + x;
                    newNode.tagColor = 'null';
                    // 添加边界标签。  1-6：从左上的边开始，逆时针排列。 其他暂时设置为0
                    newNode.tagBorder = this.tagBorder;
                    if (x == 0) newNode.tagBorder = 2;
                    else if (x == this.maxX - 1) newNode.tagBorder = 5;
                    // 添加点击事件
                    newNode.on(cc.Node.EventType.TOUCH_END, function (event) {
                        self.onTouchChess(event);
                    });
                }
            }
        }
    },

    // 判断输赢
    judgeWinner() {
        var cntRed = 0, cntBlue = 0, cntNull = 0;
        this.listTagNum = [];  // 清空记录
        for (var i = 0; i < this.chessList.length; ++i) {
            let chess = this.chessList[i];
            if (chess) {
                // todo: 清除死子
                // if (chess.tagColor == 'red') {
                // }
                // else if (chess.tagColor == 'blue') {
                // }
                // 计算空地大小，并判断其归属 （todo: 公共用地的划分）
                let colorEnclosure = this.detectEnclosure(chess);
                if (colorEnclosure == 'red') {
                    cntRed++;
                }
                else if (colorEnclosure == 'blue') {
                    cntBlue++;
                }
            }
        }
        this.strOver = '红' + cntRed + '蓝' + cntBlue + '，'
        if (cntRed > cntBlue)
            return 'red';
        else if (cntRed < cntBlue)
            return 'blue';
    },

    // 判断某块空地的归属
    detectEnclosure(chess) {
        if (this.listTagNum.indexOf(chess.tagNum) != -1)
            return false;  // 表示这个点已经检测过
        if (chess.tagColor == 'null') {
            if (chess.tagNum == 13)
                console.log(13);
            this.listTagNum.push(chess.tagNum);
            // 往三个方向检测
            let color1 = this.detectEnclosure(this.upDownOf(chess));
            if (color1 == 'red' || color1 == 'blue') {
                let color2 = this.detectEnclosure(this.leftOf(chess));
                if (color1 == color2) {
                    if (this.detectEnclosure(this.rightOf(chess)) == color1) {
                        return color1;  // 表示属于 color1 (red or blue)
                    }
                }
            }
            return 'null';  // 表示没有归属
        } else if (chess.tagColor == 'red') {
            return 'red';  // 表示属于 red
        }
        else if (chess.tagColor == 'blue') {
            return 'blue';  // 表示属于 blue
        }
    },

    // 根据 this.recordJie 和 id 设置劫点
    resetJie(id) {
        let rid = this.recordJie.length - 1;
        if (rid < 0) return;
        var r = this.recordJie[rid];
        if (r.id == id) {
            this.recordJie.pop();
            this.jie[r.color] = r.tagNum;
        }
    },

    // 根据 this.recordDead 和 id 重新放上死子
    resetDead(id) {
        let rid = this.recordDead.length - 1;
        if (rid < 0) return;
        var r = this.recordDead[rid];
        if (r.id == id) {
            this.recordDead.pop();
            if (id % 2 === 0) var c = 'red';
            else var c = 'blue';
            for (var i = 0; i < r.list.length; ++i) {
                let chess = this.chessList[r.list[i]];
                chess.tagColor = c;
                this.setChess(chess);
            }
        }
    },

    // 悔棋 - 按钮点击回调函数
    huiqi() {
        this.audioButton.play();
        this.lastChessTag.setPosition(1000, 0);
        // case: 单机
        if (this.danji) {
            // 返回上一步的状态
            let num = this.recordList.pop();
            if (num === undefined) return;
            let chess = this.chessList[num],
                id = this.recordList.length;
            chess.tagColor = 'null';
            this.setChess(chess, 'null');
            this.resetJie(id);
            this.resetDead(id);
            this.changeGameState();
        }
        // case: 联机
        else {
            this.overLabel.string = this.getColorHanZi(this.gameState) + '请求悔棋';
            this.tagOverLabel = 2;  // 显示 2 秒
            // todo: 发送悔棋的请求给对手
        }
    },

    // 认输 - 按钮点击回调函数
    renshu() {
        this.strOver = this.getColorHanZi(this.gameState) + '认输，';
        this.gameOver(this.fanState());
    },

    // 停一手 - 按钮点击回调函数
    tingyishou() {
        this.audioButton.play();
        this.ting[this.gameState] = true;
        this.overLabel.string = this.getColorHanZi(this.gameState) + '停一手';
        this.tagOverLabel = 2; // 显示 2 秒
        if (this.ting[this.fanState()]) {
            this.gameOver(this.judgeWinner());
        } else {
            this.changeGameState();
        }
    },

    getColorHanZi(color) {
        if (color == 'red')
            return '红方';
        else if (color == 'blue')
            return '蓝方';
        else return 'null';
    },

    // color 为胜利方
    gameOver(color) {
        if (!color)
            var color = this.judgeWinner();
        this.audioGameOver.play();
        let colorHanzi = this.getColorHanZi(color);
        if (colorHanzi == 'null')
            this.overLabel.string = this.strOver + '双方平局';
        else
            this.overLabel.string = this.strOver + colorHanzi + '获胜';
        this.tagOverLabel = 30; // 显示 30 秒
        this.labelDaoJiShi.string = '';
    },

    // 重新开始 - 按钮点击回调函数
    restart() {
        if (true) {
            cc.director.loadScene("menu");
        } else {  // case: 不返回初始界面，直接重新开始
            this.tagOverLabel = 0;
            this.initializeParams();
            for (var i = 0; i < this.chessList.length; ++i) {
                let chess = this.chessList[i];
                if (chess && chess.tagColor) {
                    this.setChess(chess, 'null');
                }
            }
        }
    },

    update(dt) {
        if (this.labelDaoJiShi.string != '')
            this.seconds += dt;
        // 每隔 1 秒
        if (this.seconds >= 1) {
            this.seconds = 0;
            let daojishi = Number(this.labelDaoJiShi.string) - 1;
            if (daojishi < 0) {
                this.labelDaoJiShi.string = '' + this.daojishi;
                this.strOver = this.getColorHanZi(this.gameState) + '超时，';
                this.gameOver(this.fanState());
            }
            else this.labelDaoJiShi.string = '' + daojishi;
            // 如果 overLabel 存在显示文字
            if (this.tagOverLabel) {
                this.tagOverLabel -= 1;
                if (this.tagOverLabel <= 0) {
                    this.overLabel.string = '';
                    this.strOver = '';
                }
            }
        }
    }
});
