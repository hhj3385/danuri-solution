'use strict';

const sites = require('./sites/sites.service');
const apiKeys = require('./api-keys/api-keys.service');
const tickets = require('./tickets/tickets.service');
const knowledge = require('./knowledge/knowledge.service');
const auth = require('./auth/auth.service');
const chat = require('./chat/chat.service');

module.exports = function(app) {
  app.configure(sites);
  app.configure(apiKeys);
  app.configure(tickets);
  app.configure(knowledge);
  app.configure(auth);
  app.configure(chat);
};
