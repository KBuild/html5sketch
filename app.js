var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {log: true}),
    db, // use for db
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

var pathCount = [];

server.listen(9821); // use port with open server
console.log('listening to port', server.address().port);

// use static files(js, css, etc...)
app.use(express.static(__dirname + '/static'));

/* use in Express 4.x */
app.use(session({
    secret: 'session',
    store: new MongoStore({
        url: 'mongodb://user:passwd@localhost:27017/session'
    })
}));
app.use(bodyParser());
app.use(cookieParser());
app.engine('html', require('ejs').renderFile);
var router = express.Router(); // get an instance of the express Router
/* using now */


/* not use in Express 4.x */
//var MemStore = express.session.MemoryStore;
//app.use(express.cookieParser());
//app.use(express.bodyParser());
//app.use(express.session( { secret: "myserv", store: MemStore({reapInterval:60000}) } ));
//app.use(app.router);
/* not use */

var nowNickname = '', nowRoomname = '';

// default connection
router.route('/')
    .get( function (req, res) {
        //console.log(req.session);

        if(!req.session) {
            res.sendfile(__dirname + '/login.html');
        } else {
            warns = {};
            if(!(req.session.nickname)) {
                warns.nickname = false;
            } else {
                warns.nickname = req.session.nickname;
            }
            if(!(req.session.roomname)) {
                warns.roomname = false;
            } else {
                warns.roomname = req.session.roomname;
            }
            if( !(warns.nickname) || !(warns.roomname) ) {
                res.render(__dirname + '/login.html', warns);
            } else {
                nowNickname = req.session.nickname;
                nowRoomname = req.session.roomname;
                db = require('./db.js')(nowRoomname);
                res.sendfile(__dirname + '/index.html');
            }
        }
    });

router.route('/login')
    .post( function(req, res) {
        req.session.nickname = req.param('nickname');
        req.session.roomname = req.param('roomname');
        //console.log(req.session);
        res.redirect('/');
    });

app.use('/', router);

/*db.getCount(function(data) {
    pathCount[nowRoomname] = data.count;
});*/

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
            pathCount[nowRoomname] = data.count;
        });
    });
    
    // get info from browser
    socket.on('drawStack', function (data) {
        data.idx = pathCount[nowRoomname]++;
        data.nickname = nowNickname;
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
        //console.log(pathCount);

        if(data.gt < pathCount[nowRoomname]) {
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
        db.clear(nowRoomname);
        if(pathCount != 0) {
            pathCount = 0;
            socket.emit('clear');
        }
    });
    
    // when browser connected to server
    socket.on('connect', function (data) {
        console.log(nowNickname + '('+nowRoomname+') connected');
    });
    
    // when browser disconnected to server
    socket.on('disconnect', function (data) {
        console.log(nowNickname + '('+nowRoomname+') disconnected');
        db.exit();
    });
    
    socket.join('timer');
});
