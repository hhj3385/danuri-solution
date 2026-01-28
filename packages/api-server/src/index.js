'use strict';

require('dotenv').config();

const app = require('./app');
const port = app.get('port') || process.env.API_PORT || 3030;
const host = app.get('host') || process.env.API_HOST || 'localhost';

const server = app.listen(port);

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

server.on('listening', () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     DANURI API Server                          ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`🚀 Server running at http://${host}:${port}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`📋 Health check: http://${host}:${port}/health`);
});
