/**
 * DANURI ITSM Core API
 * Node.js 20 + Feathers.js 5.x
 */

import app from './app';

app.get('/health', (_req: any, res: any) => {
  res.json({ success: true, message: 'ok', timestamp: new Date().toISOString() });
});

const port = app.get('port') || 3030;
const server = app.listen(port);

server.on('listening', () => {
  console.log(`DANURI Core API listening on http://localhost:${port}`);
});
