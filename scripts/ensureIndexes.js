/*jslint node: true */
'use strict';

var mongoose = require('mongoose');
var User = require('../lib/models/User');
var settings = require('../lib/settings');

function ensureIndexes(done) {
  User.ensureIndexes(done);
}

var db;

var opts = {
  db: {
    w: 1,
    safe: true,
    native_parser: settings.mongo_native_parser
  },
  server: {
    socketOptions: {
      // If we attempt to connect for 45 seconds, stop.
      connectTimeoutMS: 45000,
      keepAlive: 1
    }
  }
};

if (settings.mongo_user !== undefined) {
  opts.user = settings.mongo_user;
  opts.pass = settings.mongo_password;
}

mongoose.connect(settings.mongo_host, settings.mongo_db, settings.mongo_port, opts);

db = mongoose.connection;

db.on('error', function (error) {
  console.log('Error connecting to MongoDB server:');
  console.log(error);
  throw error;
});

db.once('open', function () {
  ensureIndexes(function () {
    db.close();
  });
});
