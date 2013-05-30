/*jslint node: true nomen: true*/
'use strict';

var twilio = require('twilio');
var _ = require('lodash');
var settings = require('../settings');
var User = require('../models/User');
var util = require('../util');

exports.inbound = function inbound(req, res) {
  User.findOne({ 'hotlines.hotline': req.body.To }, function (error, doc) {
    if (util.handleError(error, res)) { return; }

    if (!doc) {
      res.send(404);
      return;
    }

    var index = _.findIndex(doc.hotlines, function (o) {
      return o.hotline === req.body.To;
    });

    if (index === -1) {
      res.send(500);
      return;
    }

    var agent = doc.hotlines[index].agent;
    var resp = new twilio.TwimlResponse();
    resp
    .say('Please wait while we connect you', {
      voice: 'woman',
      language: 'en-us'
    })
    .dial(agent);
    res.set('content-type', 'application/xml');
    res.send(resp.toString());
  });
};
