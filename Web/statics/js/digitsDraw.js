// 定义websocket
var socket; 
if (!window.WebSocket) 
{ 
    window.WebSocket = window.MozWebSocket; 
} 
if (window.WebSocket) 
{ 
    socket = new WebSocket("ws://192.168.43.233:8888/Websocket"); // localhost
    socket.onopen = function(event)
    { 
        alert("开始画画吧！"); 
    };  
    socket.onmessage = function(event) 
    { 
       alert(event.data);
    }; 
    socket.onclose = function(event) 
    { 
        alert("Oops！"); 
    }; 
} 
else 
{ 
    alert("您的浏览器不支持 Web Socket."); 
} 


//Canvas功能
//定义手写类
function WriteFont(id, options) 
{
    var self = this;
    this.canvas = document.getElementById(id);
    var obj = 
    {
        canvas: this.canvas,
        context: this.canvas.getContext("2d"),
        isWrite: false, //是否开始
        canvasWidth: 250, //canvas宽高
        canvasHeight: 600,
        bgColor: '#fff', //背景色
        lastPoint: {}, //
        writeWidth: 15, //基础轨迹宽度
        writeColor: 'black', // 轨迹颜色
    }
     
    /**
    * 轨迹宽度
    */
    this.setLineWidth = function() 
    {
        obj.context.lineWidth = obj.writeWidth;
    }
     
    /**
    * 绘制轨迹
    */
    this.writing = function(point) 
    {
        obj.context.beginPath();
        obj.context.moveTo(obj.lastPoint.x, obj.lastPoint.y);
        obj.context.lineTo(point.x, point.y);
        self.setLineWidth();
        obj.context.stroke();
        obj.lastPoint = point;
        obj.context.closePath();
    }
     
    /**
    * 轨迹样式
    */
    this.writeContextStyle = function() 
    {
        obj.context.beginPath();
        obj.context.strokeStyle = obj.writeColor;
        obj.context.lineCap = 'round';
        obj.context.lineJoin = "round";
    }
     
    /**
    * 写开始
    */
    this.writeBegin = function(point) 
    {
        obj.isWrite = true;
        obj.lastPoint = point;
        self.writeContextStyle();
    }
     
    /**
    * 写结束
    */
    this.writeEnd = function() 
    {
        obj.isWrite = false;
    }
     
    /**
    * 清空画板
    */
    this.canvasClear = function() 
    {
        obj.context.save();
        obj.context.strokeStyle = '#fff';
        obj.context.clearRect(0, 0, obj.canvasWidth, obj.canvasHeight);
        //将画板背景填充为白色
        obj.context.fillStyle="white";
        obj.context.fillRect(0,0,obj.canvasWidth,obj.canvasHeight)
        obj.context.restore();
    }

    /**
    * 保存图片 格式base64
    */
    this.saveAsImg = function() 
    {
        image = this.canvas.toDataURL("image/png");
        socket.send(image);   //发给后端
    };
     
    /**
    * 初始化画板
    */
    this.canvasInit = function() 
    {
        this.canvas.width = obj.canvasWidth;
        this.canvas.height = obj.canvasHeight;
        this.emptyCanvas = this.canvas.toDataURL("image/png");
        //填充为白色
        obj.context.fillStyle="white";
        obj.context.fillRect(0,0,this.canvas.width,this.canvas.height)
    }
     
    /**======================事件绑定===========================**/
     
    this.canvas.addEventListener('mousedown', function(e) 
    {
        var point = {
        x: e.offsetX || e.clientX,
        y: e.offsetY || e.clientY
        };
        self.writeBegin(point);
    });
     
    this.canvas.addEventListener('mouseup', function(e) {
        var point = {
        x: e.offsetX,
        y: e.offsetY
        };
        self.writeEnd(point);
    });
     
    this.canvas.addEventListener('mouseleave', function(e) 
    {
        var point = {
        x: e.offsetX,
        y: e.offsetY
        };
        self.writeEnd(point);
    });
     
    this.canvas.addEventListener('mousemove', function(e) 
    {
        if(obj.isWrite) {
            var point = {
                x: e.offsetX,
                y: e.offsetY
            };
            self.writing(point);
        }
    });
     
    //移动端
    this.canvas.addEventListener('touchstart', function(e) 
    {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var point = {
            x: touch.pageX,
            y: touch.pageY
        };
        self.writeBegin(point);
    });
    this.canvas.addEventListener('touchend', function(e) 
    {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var point = 
        {
            x: touch.pageX,
            y: touch.pageY
        };
        self.writeEnd(point);
    });
    this.canvas.addEventListener('touchmove', function(e) 
    {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var point = {
            x: touch.pageX,
            y: touch.pageY
        };
        self.writing(point);
    });
     
    this.canvasInit();
    this.canvasClear();
     
    this.option = obj;
    obj.control = {
        clearCanvas: self.canvasClear
    };
}
     
/**
* 初始化调用
* 设置参数
*/

var writeCanvas = new WriteFont('drawingCanvas', {
    borderWidth: 10,
    writeWidth:3,
    borderColor: '#ff6666',
});

//按钮绑定清空画板
document.getElementById('clear').onclick = function() {
    writeCanvas.option.control.clearCanvas();
};


//按钮绑定保存图片
document.getElementById('save').onclick = function() {
    writeCanvas.saveAsImg()
};





