var mongodb = require('mongodb');
var config = require("./config");

var server = new mongodb.Server(config.dbm.host, config.dbm.port, {auto_reconnect: true});
var db = new mongodb.Db(config.dbm.database, server, {safe: true});

//返回collection
exports.c = function (name, callback) {
    db.open(function (err, dbs) {
            if (!err) {
                console.log('connect');
                db.collection(name, {safe: true}, function (err, collection) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        callback(collection);
                    }
                });

            }
            else {
                console.log(err);
            }
        }
    );
};


//返回datas
exports.q = function (name, callback) {
    exports.c(name, function (collection) {
            collection.find().toArray(function (err, datas) {
                console.log("dbm->q start");
                callback(datas);
                console.log("dbm->q end");
            });
        }
    )
};


//返回db
exports.d = function (callback) {
    db.open(function (err, dbs) {
            if (!err) {
                console.log('c');

                callback(dbs);
            }
            else {
                console.log(err);
            }
        }
    );
};