//use database
//var mysql = require('mysql');
//var mysqlConfig = require('./config.js')("mysql");
var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('sketcher', server);

//open mongodb
db.open(function(err, db) {
    /*db.authenticate('kbuild', 'mongo7995', function(err, result) {
        if(result == true) {
            console.log('DB authed');
        }
    });*/
    if(!err) {
        console.log('DB connected');
        db.collection('path', {safe:true}, function(err, col) {
            if(err) {
                console.error('Collection not exists. ' + err);
            }
        });
    } else {
        console.error('DB cannot connect. ' + err);
    }
});

module.exports.save = function(data) {
    db.collection('path', {safe:true}, function(err, col) {
        col.insert(data, {safe:true}, function(err, result) {
            if (err) {
                 console.error('Collection error : ' + err);
             } else {
                 console.log('Success: ' + JSON.stringify(result[0]));
             }
         });
    });
}

module.exports.load = exports = function(gt, callback) {
    db.collection('path', {safe:true}, function(err, col) {
        col.find({'idx':{$gt:gt}}).sort({'idx':-1}).toArray(function(err, items) {
            callback(items);
        });
    });
}

module.exports.getCount = exports = function(callback) {
    db.collection('path', {safe:true}, function(err, col) {
        col.find().count(function(err, result) {
            if(result) {
                callback({count: result});
            } else {
                callback({count: 0});
            }
        });
    });
}

module.exports.clear = exports = function() {
    db.collection('path', {safe:true}, function(err, col) {
        col.remove(function(err, count) {
            console.log(count + ' deleted.')
        });
    });
}