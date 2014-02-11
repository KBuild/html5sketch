var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {log: true}),
    db = require('./db.js');

var MemStore = express.session.MemoryStore;
var pathCount = 0;

db.getCount(function(data) {
    pathCount = data.count;
});

server.listen(9821); // use port with open server

// use static files(js, css, etc...)
app.use(express.static(__dirname + '/static'));

app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session( { secret: "myserv", store: MemStore({reapInterval:60000}) } ));
app.use(app.router);

// default connection
app.get('/', function (req, res) {
//    if(!req.session || !(req.session.nickname && req.session.roomname) ) {
//        res.sendfile(__dirname + '/login.html');
//    } else {
        res.sendfile(__dirname + '/index.html');
//    }
});

app.post('/login', function(req, res) {
    //console.log( req.session );
    req.session.nickname = req.param('nickname');
    req.session.roomname = req.param('roomname');
    res.redirect('/');
});

// loop with array
var looping = function( socket, count, data ) {
    
    if ( count <= 0 ) return;
    count--;
    
    //send to browser, pop data
    output = data.pop();
    socket.emit('print', { data: output });
    
    process.nextTick(function() {
        looping( socket, count, data );
    });
}

setInterval(function() {
    io.sockets.in('timer').emit('checkCount');
}, 1000);

io.sockets.on('connection', function (socket) {
    socket.on('getCount', function (data) {
        db.getCount(function(data) {
            socket.emit('getCount', data);
            pathCount = data.count;
        });
    });
    
    // get info from browser
    socket.on('drawStack', function (data) {
            data.idx = pathCount++;
            db.save(data); // save as database(mongodb)
    });
    
    socket.on('readAll', function(data) {
        db.load(0, function(datas) {
            if(datas) {
                db.getCount(function(data) {
                    looping(socket, data.count, datas);
                });
            }
        });
    });
    
    socket.on('readSome', function(data) {
        console.log(pathCount);
        if(data.gt < pathCount) {
            db.load(data.gt, function(datas) {
                if(datas) {
                    db.getCount(function(data) {
                        looping(socket, data.count, datas);
                        socket.emit('setCount', {count: data.count});
                    });
                }
            });
        }
    });
    
    // clear all log(in database)
    socket.on('clear', function (data) {
       db.clear(); 
    });
    
    // when browser connected to server
    socket.on('connect', function (data) {
        console.log('connected');
    });
    
    // when browser disconnected to server
    socket.on('disconnect', function (data) {
        console.log('disconnected');
    });
    
    socket.join('timer');
});