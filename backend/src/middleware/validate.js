import { sendError } from '../utils/response.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errorDetails = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(res, 'Validation failed for request data', errorDetails, 400);
      }

      req[source] = result.data;
      next();
    } catch (err) {
      return sendError(res, 'Internal validation error', [err.message], 500);
    }
  };
};

