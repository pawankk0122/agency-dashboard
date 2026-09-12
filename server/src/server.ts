import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './socket/index.js';
import { startOverdueScanner } from './jobs/overdueScanner.js';

const httpServer = http.createServer(app);
export const io = initSocketServer(httpServer, env.CLIENT_URL);

startOverdueScanner();

httpServer.listen(Number(env.PORT), () => {
  console.log(`Server listening on port ${env.PORT}`);
});
