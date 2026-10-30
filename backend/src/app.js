import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development, strict in prod
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Request Body Parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (Prevents abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api/', limiter);

// Health check endpoints
app.get('/health', (req, res) => {
  return sendSuccess(res, 'SmartFlow AI backend is healthy and operational', {
    status: 'up',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
});

app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'SmartFlow AI API v1 is healthy and operational', {
    status: 'up',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome route
app.get('/', (req, res) => {
  return res.json({
    success: true,
    name: 'SmartFlow AI – Backend API',
    version: '1.0.0',
    status: 'operational',
    environment: env.NODE_ENV,
    frontend_url: env.FRONTEND_URL,
    docs: {
      health: '/health',
      api_base: '/api/v1',
      auth: '/api/v1/auth/login',
    },
    message: 'API is running. Open the frontend URL in your browser to use the application.',
  });
});

// Mount Main API Routes
app.use('/api/v1', apiRoutes);

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: ['Endpoint does not exist'],
  });
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;

