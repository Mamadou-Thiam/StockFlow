import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

const envFile = nodeEnv === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const config = {
  nodeEnv,
  port: parseInt(process.env.PORT || '5000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/stockflow_dev',
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@stockflow.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
};

export default config;
