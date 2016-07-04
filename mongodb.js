var mongodb = require('mongodb');
var server = new mongodb.Server('153.122.98.240', 3005, {auto_reconnect: true});
var db = new mongodb.Db('tj', server, {safe: true});


exports.e = function (callback) {
    db.open(function (err, dbs) {
            if (!err) {
                console.log('connect');
                callback(dbs);
            }
            else {
                console.log(err);
            }
        }
    );
};
