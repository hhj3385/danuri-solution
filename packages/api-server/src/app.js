'use strict';

const path = require('path');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const configuration = require('@feathersjs/configuration');

const services = require('./services');
const channels = require('./channels');
const middleware = require('./middleware');

const app = express(feathers());

// Load app configuration
app.configure(configuration());

// Enable security, CORS, compression
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(compress());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Host static files
app.use('/', express.static(app.get('public')));

// Configure Socket.io with real-time channels
app.configure(socketio({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
}));

// Configure services
app.configure(services);

// Configure middleware
app.configure(middleware);

// Configure channels for real-time events
app.configure(channels);

// Configure Express REST transport
app.configure(express.rest());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({
  html: false,
  logger: console
}));

module.exports = app;
