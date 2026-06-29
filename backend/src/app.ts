import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initializeCronJobs } from './utils/cronJobs';
import { autoSeed } from './seed';
import config from './config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  await autoSeed();
  initializeCronJobs();

  app.listen(config.port, () => {
    console.log(`Stockflow API démarrée sur le port ${config.port} (${config.nodeEnv})`);
  });
};

startServer();

export default app;
