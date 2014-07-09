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
        db.authenticate('user', 'passwd', function(err, result) {
            if(result == true) {
                console.log('DB authed');
            }

            if(!err) {
                console.log('DB connected');
                db.collection('path', {safe:true}, function(err, col) {
                    if(err) {
                        console.error('Collection error in Connection. ' + err);
                    }
                });
            } else {
                console.error('DB cannot connect. ' + err);
            }
        });
    });


    module.exports.save = exports = function(data) {
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

    module.exports.load = exports = function(gt, rname, callback) {
        db.collection('path', {safe:true}, function(err, col) {
            col.find({'idx':{$gt:gt},'roomname':rname}).sort({'idx':-1}).toArray(function(err, items) {
                callback(items);
            });
        });
    }

    module.exports.getCount = exports = function(rname, callback) {
        db.collection('path', {safe:true}, function(err, col) {
            col.find({'roomname':rname}).count(function(err, result) {
                if(result) {
                    callback({count: result});
                } else {
                    callback({count: 0});
                }
            });
        });
    }

    module.exports.clear = exports = function(rname) {
        db.collection('path', {safe:true}, function(err, col) {
            col.remove({'roomname':rname},{},function(err, count) {
                //console.log(count + ' deleted.')
            });
        });
    }

    module.exports.exit = exports = function() {
        db.close();
    }

