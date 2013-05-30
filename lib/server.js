/*jslint node: true */
'use strict';

var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var s3 = require('connect-s3');
var passport = require('passport');

var settings = require('./settings');
var routes = require('./routes');

// Basic app variables
var server;
var app = express();
var db = null;

// Specify logging through an environment variable, so we can log differently
// locally, on dev/test Heroku apps, and on production Heroku apps.
// if (process.env.EXPRESS_LOGGER) {
//   app.use(express.logger(process.env.EXPRESS_LOGGER));
// }
app.use(express.logger('dev'));

// Have Express wrap the response in a function for JSONP requests
// https://github.com/visionmedia/express/issues/664
app.set('jsonp callback', true);

// Use a compact JSON representation
app.set('json spaces', 0);

// Allow Heroku to handle SSL for us
app.enable('trust proxy');

// Allows clients to simulate DELETE and PUT
// (some clients don't support those verbs)
// http://stackoverflow.com/questions/8378338/what-does-connect-js-methodoverride-do
app.use(express.methodOverride());

app.use(express.json());
app.use(express.urlencoded());
app.use(express.compress());

// Add common headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Mime-Type, X-Requested-With, X-File-Name, Content-Type");
  next();
});


function setupAuth(settings, db) {
  // Authentication-related middleware
  app.use(express.cookieParser());
  app.use(express.session({
    secret: settings.secret,
    store: new MongoStore({
      db: settings.mongo_db,
      mongoose_connection: db,
      maxAge: 300000
    })
  }));

  // Initialize Passport. Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
}

function setupRoutes() {
  routes.setup(app);

  // Serve the frontend web app from /
  app.use(s3({
    pathPrefix: '/',
    remotePrefix: settings.frontendPrefix
  }));
}

// We're done with our preflight stuff.
// Now, we start listening for requests.
function startServer(port, cb) {
  server = http.createServer(app);
  server.listen(port, function (err) {
    console.log('Listening on ' + port);
    if (cb !== undefined) { cb(err); }
  });
}

function run(cb) {
  // Set up the database object
  if (db === null || db.readyState === 0) {
    if (db !== null) {
      db.removeAllListeners();
    }

    console.log('Using the following settings:');
    console.log('Port: ' + settings.port);
    console.log('Mongo host: ' + settings.mongo_host);
    console.log('Mongo port: ' + settings.mongo_port);
    console.log('Mongo db: ' + settings.mongo_db);
    console.log('Mongo user: ' + settings.mongo_user);

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

    db.on('disconnected', function () {
      console.log('Error: we have been disconnected from the MongoDB server.');
    });

    db.on('reconnected', function () {
      console.log('We have reconnected to the MongoDB server.');
    });

    db.once('open', function () {
      setupAuth(settings, db);
      setupRoutes(); // Needs to happen AFTER setupAuth
      startServer(settings.port, cb);
    });
  }
}

function stop(done) {
  server.close();
  db.close(function () {
    console.log('Stopped server');
    if (done) { return done(); }
  });
}

module.exports = {
  run: run,
  stop: stop
};

// If this was run directly, run!
if (require.main === module) {
  run();
}
