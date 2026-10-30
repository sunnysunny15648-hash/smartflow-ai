import { sendError } from '../utils/response.js';

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.memberRole) {
      return sendError(res, 'Access denied: No organizational role assigned', [], 403);
    }

    if (!allowedRoles.includes(req.memberRole)) {
      return sendError(
        res,
        `Access forbidden: Operation requires one of the following roles: ${allowedRoles.join(', ')}`,
        [],
        403
      );
    }

    next();
  };
};

