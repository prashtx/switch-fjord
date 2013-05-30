/*jslint node: true nomen: true*/
'use strict';

var _ = require('lodash');
var util = require('../util');
var User = require('../models/User');
var settings = require('../settings');

var client = require('twilio')(settings.twilioSid, settings.twilioAuthToken);

function makeTwilioVoiceUrl(req) {
  return req.protocol + req.get('host') + '/twilio/voice/inbound';
}

// List a user's hotline numbers.
exports.list = function list(req, res) {
  User.findOne({ '_id': req.params.user }, function (error, doc) {
    if (util.handleError(error, res)) { return; }
    res.send(doc.hotlines);
  });
};

// Get info on a hotline number.
exports.get = function get(req, res) {
  var hotline = '+' + req.params.number;

  User.findOne({ '_id': req.params.user }, function (error, doc) {
    if (util.handleError(error, res)) { return; }
    var index = _.findIndex(doc.hotlines, function (o) {
      return o.hotline === hotline;
    });

    if (index === -1) {
      res.send(404);
      return;
    }

    doc.save(function (error) {
      if (util.handleError(error, res)) { return; }
      res.send(doc.hotlines[index]);
    });
  });
};

// Add a new hotline number.
// POST data should be of the form
//   { "agentNumber": "+14155551234" }
exports.post = function post(req, res) {
  var user = req.params.user;
  var agentNumber = req.body.agentNumber;

  // Provision a Twilio number, and connect it to the app.
  client.incomingPhoneNumbers.create({
    areaCode: '415',
    voiceUrl: makeTwilioVoiceUrl(req)
  }, function (error, purchasedNumber) {
    console.log('Purchased phone number ' + purchasedNumber.phoneNumber);
    // Save number to the database.
    User.findOne({ _id: user }, function (error, doc) {
      if (error) {
        // TODO: unprovision phone number, or add it to a graveyard pool
        res.send(500);
        console.log(error);
        return;
      }

      doc.hotlines.push({
        hotline: purchasedNumber.phoneNumber,
        sid: purchasedNumber.sid,
        agent: agentNumber
      });

      doc.save(function (error, user) {
        if (util.handleError(error, res)) { return; }
        res.send(user);
      });
    });
  });
};

// Modify a hotline number.
exports.put = function put(req, res) {
  var hotline = '+' + req.params.number;
  User.findOne({ '_id': req.params.user }, function (error, doc) {
    if (util.handleError(error, res)) { return; }
    var index = _.findIndex(doc.hotlines, function (o) {
      return o.hotline === hotline;
    });

    if (index === -1) {
      res.send(404);
      return;
    }

    doc.hotlines[index].agent = req.body;
    doc.save(function (error) {
      if (util.handleError(error, res)) { return; }
      res.send(doc.hotlines[index]);
    });
  });
};
