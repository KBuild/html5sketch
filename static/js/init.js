var sketcher, socket, loop;
window.onload = function() {
    //sketcher init
    brush = document.createElement("img");
    brush.src = "assets/brush.png";
    
    //handling socket.io
    socket = io.connect('http://localhost');
    socket.emit('getCount');
    socket.on('getCount', function(data) {
        sketcher = new Sketcher("sketch", brush, data.count); //allocate sketcher object
        socket.emit('readAll'); // read path
    });
    socket.on('setCount', function(data) {
        sketcher.count = data.count;
    });
    socket.on('print', function (data) {
        if(data.data) {
            sketcher.reDraw(data.data);
        }
    });
    socket.on('checkCount', function(data) {
        socket.emit('readSome', {gt: sketcher.count});
    });
    
    /*socket.on('startLoad', function(data) {
        loop = setInterval(function() {
            socket.emit('read', {lt: sketcher.count});
        }, 500);
    });
    
    socket.on('stopLoad', function(data) {
        clearInterval(loop);
    });*/
        
}