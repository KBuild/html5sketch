//use database
//var mysql = require('mysql');
//var mysqlConfig = require('./config.js')("mysql");
var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('sketcher', server);

module.exports = function(roomname) {
    var rname = roomname;
    var module = {};

    //open mongodb
    db.open(function(err, db) {
        db.authenticate('user', 'passwd', function(err, result) {
            if(result == true) {
                console.log('DB authed');
            }
        });
        if(!err) {
            console.log('DB connected');
            db.collection(rname, {safe:true}, function(err, col) {
                if(err) {
                    console.error('Collection error; ' + err);
                }
            });
        } else {
            console.error('DB cannot connect. ' + err);
        }
    });

    module.save = function(data) {
        db.collection(rname, {safe:true}, function(err, col) {
            col.insert(data, {safe:true}, function(err, result) {
                if (err) {
                     console.error('Collection error : ' + err);
                 } else {
                     console.log('Success: ' + JSON.stringify(result[0]));
                 }
             });
        });
    }

    module.load = function(gt, callback) {
        db.collection(rname, {safe:true}, function(err, col) {
            col.find({'idx':{$gt:gt}}).sort({'idx':-1}).toArray(function(err, items) {
                callback(items);
            });
        });
    }

    module.getCount = function(callback) {
        db.collection(rname, {safe:true}, function(err, col) {
            col.find().count(function(err, result) {
                if(result) {
                    callback({count: result});
                } else {
                    callback({count: 0});
                }
            });
        });
    }

    module.clear = function() {
        db.collection(rname, {safe:true}, function(err, col) {
            col.remove(function(err, count) {
                //console.log(count + ' deleted.')
            });
        });
    }

    module.exit = function() {
        db.close();
    }

    return module;
};

    
