import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import apiRoutes from './routes/api.js';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount the API routes
app.use('/api', apiRoutes);

app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

app.use(errorHandler);

export default app;
