/*jslint node: true */
'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

function hashToken(item) {
  return bcrypt.hashSync(item, 10);
}

var userSchema = new mongoose.Schema({
  // We don't use the Mongoose version number when communicating with clients.
  __v: { type: Number, select: false },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  hash: { type: String, required: true },
  hotlines: [{
    hotline: String,
    sid: String,
    agent: String
  }]
}, {
  autoIndex: false
});

// Indexes
// Make sure email is unique
userSchema.index({ email: 1 }, { unique: true });
// Index the hotline numbers
userSchema.index({ 'hotlines.hotline': 1 });

userSchema.virtual('password').set(function (password) {
  this.hash = hashToken(password);
});

userSchema.methods.validPassword = function validPassword(password) {
  return bcrypt.compareSync(password, this.hash);
};

userSchema.methods.hashToken = hashToken;
userSchema.statics.hashToken = hashToken;

// By default, don't include the password hash when turning a User document
// into an object.
var conversionOptions = {
  getters: true,
  transform: function (doc, ret, options) {
    return {
      id: ret.id,
      email: ret.email,
      name: ret.name,
      reset: ret.reset
    };
  }
}
userSchema.set('toObject', conversionOptions);
userSchema.set('toJSON', conversionOptions);

var User = module.exports = mongoose.model('User', userSchema);
