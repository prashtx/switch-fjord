/*jslint node: true */
'use strict';

var users = require('./controllers/users');
var numbers = require('./controllers/numbers');
var voice = require('./controllers/voice');

function enforceHTTPS(req, res, next) {
  if (!req.secure) {
    res.send(400);
    return;
  }
  next();
}

exports.setup = function setup(app) {
  // Users
  app.get('/api/user', users.ensureAuthenticated, users.get);
  app.post('/api/user', enforceHTTPS, users.post);
  app.post('/api/login', enforceHTTPS, users.login);
  app.get('/logout', users.logout);
  app.get('/auth/return', users.auth_return);
  app.get('/api/users/:user', users.get);

  // Numbers
  app.get('/api/users/:user/numbers', users.ensureAuthenticated, numbers.list);
  app.get('/api/users/:user/numbers/:number', users.ensureAuthenticated, numbers.get);
  app.post('/api/users/:user/numbers', users.ensureAuthenticated, numbers.post);
  app.put('/api/users/:user/numbers/:number', users.ensureAuthenticated, numbers.put);

  // Twilio
  app.post('/twilio/voice/inbound', voice.inbound);

};
