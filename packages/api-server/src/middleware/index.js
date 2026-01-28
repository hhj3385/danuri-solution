'use strict';

const decrypt = require('./decrypt');

module.exports = function(app) {
  // Add decrypt middleware for handshake
  app.use('/api/auth/handshake', decrypt(app));
};
