import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    user: req.user?.id,
    org: req.organizationId,
  });

  if (err.name === 'ZodError') {
    return sendError(res, 'Validation error', err.errors, 400);
  }

  if (err.status || err.statusCode) {
    return sendError(res, err.message, [err.message], err.status || err.statusCode);
  }

  // Handle Supabase/PostgreSQL common error codes
  if (err.code === '23505') {
    return sendError(res, 'A record with these details already exists (duplicate key)', [err.detail], 409);
  }
  if (err.code === '23503') {
    return sendError(res, 'Referenced item was not found (foreign key constraint)', [err.detail], 400);
  }

  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected internal server error occurred' 
    : err.message || 'Internal Server Error';

  return sendError(res, message, [], 500);
};

