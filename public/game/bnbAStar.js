var Astar = function(map){
	this.map = map;
	
	//已探索列表
	this.chkList = [];
	//开放对象列表
	this.openList = [];
	
	//取G值
	this.getG = function(x0,y0,x1,y1){
		if(Math.abs(x0-x1)==1 && Math.abs(y0-y1)==1){
			return 14;
		}else{
			return 10;
		}
	}
	
	//取H值Diagonal Shortcut
	this.getH = function(x0,y0,x1,y1){
		var xDistance = Math.abs(x0-x1);
		var yDistance = Math.abs(y0-y1);
		if(xDistance > yDistance){
			return (14*yDistance + 10*(xDistance-yDistance));
		}else{
			return (14*xDistance + 10*(yDistance-xDistance));
		}
	}
	
	//节点对象
	this.point = function(_f,_g,_h,_x,_y,_p){
		this.f = _f;
		this.g = _g;
		this.h = _h;
		this.x = _x;
		this.y = _y;
		this.p = _p;
	}
	
	//获取检测子节点对象
	this.setPoints = function(_node,x1,y1){
		var map = this.map;
		var x = _node.x;
		var y = _node.y;
		var g = _node.g;
		var t = x-1;
		var b = x+1;
		var l = y-1;
		var r = y+1;
		var maxX = map.length;
		var maxY = map[0].length;
		//if(t>=0 && l>=0 && (map[t][l]==0 || map[t][l]>100) && (map[t][y]==0 || map[t][y]>100) && (map[x][l]==0 || map[x][l]>100)) this.chkPoint(_node,x,y,g,t,l,x1,y1);//1
		if(t>=0 && map[t][y]==0) this.chkPoint(_node,x,y,g,x-1,y,x1,y1);//2
		//if(t>=0 && r<maxY && (map[t][r]==0||map[t][r]>100) && (map[t][y]==0 || map[t][y]>100) && (map[x][r]==0 || map[x][r]>100)) this.chkPoint(_node,x,y,g,t,r,x1,y1);//3
		if(l>=0 && (map[x][l]==0 || map[x][l]>100)) this.chkPoint(_node,x,y,g,x,y-1,x1,y1);//4
		if(r<maxY && (map[x][r]==0 || map[x][r]>100)) this.chkPoint(_node,x,y,g,x,y+1,x1,y1);//6
		//if(b<maxX && l>=0 && (map[b][l]==0 || map[b][l]>100) && (map[x][l]==0 || map[x][l]>100) && (map[b][y]==0||map[b][y]>100)) this.chkPoint(_node,x,y,g,b,l,x1,y1);//7
		if(b<maxX && map[b][y]==0) this.chkPoint(_node,x,y,g,x+1,y,x1,y1);//8
		//if(b<maxX && r<maxY && (map[b][r]==0 || map[b][r]>100) && (map[b][y]==0||map[b][y]>100) && (map[x][r]==0||map[x][r]>100)) this.chkPoint(_node,x,y,g,b,r,x1,y1);//9
	}
	
	//检测子节点对象
	this.chkPoint = function(_fnode,_x0,_y0,_g,_x1,_y1,_x2,_y2){
		var open = this.openList;
		var chk = this.chkList;
		var _id = new String(_x1+'_'+_y1);
		var _point = null;
		if(undefined == (_point = chk[_id])){
			_point = new this.point(0,0,0,_x1,_y1,_fnode);
			open[open.length] = _point;
			chk[_id] = _point;
			_point.g = _g + this.getG(_x0,_y0,_x1,_y1);	//起点到当前点实际值
			_point.h = this.getH(_x1,_y1,_x2,_y2);		//终点到当前点的估价
			_point.f = _point.g + _point.h;
		}else{
			var _CNG = _g + this.getG(_x0,_y0,_x1,_y1);
			if(_point.g>_CNG){//保留小G，替换parentNode
				_point.g = _CNG;
				_point.f = _point.g + _point.h;
				_point.p = _fnode;
			}
		}
	}
	
	//探索路径
	this.getPath = function(x0,y0,x1,y1){
		var st = new Date();
		var tp = [];
		var open = this.openList;
		var map = this.map;
		if((map[x0][y0] > 0 && map[x0][y0] < 100) || (map[x1][y1] > 0 && map[x1][y1] < 100)){
			return tp;
		}
		var _sh = this.getH(x0,y0,x1,y1);
		open[0] = new this.point(_sh,0,_sh,x0,y0,null);
		var oll=0,nowNode=null;
		while(0<(oll=open.length)){
			var maxNode,minIndex,minf=10000000000;
			for(var i=0;i<oll;i++){
				maxNode = open[i];
				if(minf>maxNode.f){
					minf = maxNode.f;
					minIndex = i;
				}
			}
			nowNode = open[minIndex];
			open[minIndex] = open[oll-1];
			open.length--;
			if(nowNode.x==x1 && nowNode.y==y1){
				while(nowNode.p!=null){
					tp.push([nowNode.x,nowNode.y]);
					nowNode = nowNode.p;
				}
				tp.push([x0,y0]);
				break;
			}
			this.setPoints(nowNode,x1,y1);
		}
		open = this.openList = this.chkList = map = [];
		//document.title = new Date()-st+' ms, '+tp.length+'steps.';
		return tp.slice(0).reverse();
	}
}