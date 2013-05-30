/*jslint node: true */
'use strict';

function tryParse(str, def) {
  var val = parseInt(str, 10);
  if (isNaN(val)) { return def; }
  return val;
}

module.exports = {
  // MongoDB
  mongo_host: process.env.MONGO_HOST || 'localhost',
  mongo_port: tryParse(process.env.MONGO_PORT, 27017),
  mongo_db: process.env.MONGO_DB || 'scratchdb',
  mongo_user: process.env.MONGO_USER,
  mongo_password: process.env.MONGO_PASSWORD,
  mongo_native_parser: (process.env.MONGO_NATIVE_PARSER !== undefined &&
                        process.env.MONGO_NATIVE_PARSER.toLowerCase() === 'true'),

  // Static apps
  frontendPrefix: process.env.REMOTE_FRONTEND_PREFIX,

  SESSION_SECRET: process.env.SESSION_SECRET,
  secret: process.env.SECRET,
  
  twilioSid: process.env.TWILIO_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,

  // Web server
  port: process.env.PORT || 3000
}
