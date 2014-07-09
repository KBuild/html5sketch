var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {log: true}),
    db = require('./db.js'), // use for db
    session = require('express-session'),
    cookieParser = require('cookie-parser');
    bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);

var pathCount = [];

server.listen(9821); // use port with open server
console.log('listening to port', server.address().port);

// use static files(js, css, etc...)
app.use(express.static(__dirname + '/static'));

/* use in Express 4.x */

var sessionStore = new MongoStore({
    url: 'mongodb://user:passwd@localhost:27017/session'
});

app.use(session({
    secret: 'secretweapon',
    store: sessionStore,
    cookie: {
        maxAge: 60000,
        httpOnly: true
    }
}));
app.use(bodyParser());
app.use(cookieParser('secretweapon'));
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
    .get(function (req, res, next) {
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
                res.sendfile(__dirname + '/index.html');
            }
        }
    });

router.route('/login')
    .post(function(req, res) {
        req.session.nickname = req.param('nickname');
        req.session.roomname = req.param('roomname');
        //console.log(req.session);
        res.redirect('/');
    });

app.use('/', router);

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

var sessionTable = [];

io.sockets.on('connection', function (socket) {
    getSession(socket, function(sid, rname) {
        sessionTable[sid] = rname;
    });

    socket.on('getCount', function (data) {
        cookie = socket.handshake.headers['cookie'];
        cookies = require('express/node_modules/cookie').parse(cookie);

        origsid = String(cookies['connect.sid']);

        db.getCount(sessionTable[origsid], function(data) {
            socket.emit('getCount', data);
            pathCount[origsid] = data.count;
        });
    });
    
    // get info from browser
    socket.on('drawStack', function (data) {
        cookie = socket.handshake.headers['cookie'];
        cookies = require('express/node_modules/cookie').parse(cookie);
        origsid = String(cookies['connect.sid']);
        obj = origsid.split('s:')[1].split('.')[0];
        sid = obj;
        data.idx = pathCount[origsid]++;
        sessionStore.get(sid, function(err, session) {
            data.nickname = session.nickname;
            data.roomname = session.roomname;
            db.save(data); // save as database(mongodb)
        });
    });
    
    socket.on('readAll', function(data) {
        readPath(socket, 0);
    });
    
    socket.on('readSome', function(data) {
        readPath(socket, data.gt);
    });
    
    // clear all log(in database)
    socket.on('clear', function (data) {
        cookie = socket.handshake.headers['cookie'];
        cookies = require('express/node_modules/cookie').parse(cookie);
        origsid = String(cookies['connect.sid']);
        db.clear(sessionTable[origsid]);
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
        delete sessionTable;
        db.exit();
    });
    
    socket.join('timer');
});

var getSession = function(socket, callback) {
    cookie = socket.handshake.headers['cookie'];
    cookies = require('express/node_modules/cookie').parse(cookie);

    origsid = String(cookies['connect.sid']);
    obj = origsid.split('s:')[1].split('.')[0];
    sid = obj;

    sessionStore.get(sid, function(err, session) {
	callback(origsid, session.roomname);
    });
};

var readPath = function(socket, gt) {
        cookie = socket.handshake.headers['cookie'];
        cookies = require('express/node_modules/cookie').parse(cookie);
        origsid = String(cookies['connect.sid']);

    if(gt == 0) {
        db.load(0, sessionTable[origsid], function(datas) {
            if(datas) {
                db.getCount(sessionTable[origsid], function(data) {
                    looping(socket, data.count, datas);
                });
            }
        });
    } else {
        if(gt < pathCount[origsid]) {
            db.load(gt, sessionTable[origsid], function(datas) {
                if(datas) {
                    db.getCount(sessionTable[origsid], function(data) {
                        looping(socket, data.count, datas);
                        socket.emit('setCount', {count: data.count});
                    });
                }
            });
        }
    }
}
