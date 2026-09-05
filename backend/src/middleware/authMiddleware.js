/**
 * middleware/authMiddleware.js — JWT Authentication Guard
 * Verifies the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user for downstream handlers.
 *
 * NOTE: JWT verification will be active once jsonwebtoken is installed
 * and AUTH_SECRET is set in .env
 */

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing or malformed.',
    });
  }

  const token = authHeader.split(' ')[1];

  // TODO: Verify JWT token here once jsonwebtoken is installed
  // import jwt from 'jsonwebtoken';
  // const decoded = jwt.verify(token, process.env.AUTH_SECRET);
  // req.user = decoded;

  // Placeholder: accept any non-empty token in development
  if (process.env.NODE_ENV === 'development' && token) {
    req.user = { id: 1, role: 'Administrator' };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid or expired token.',
  });
};

/**
 * Role-based access guard.
 * @param {...string} roles - Allowed roles (e.g. 'Administrator', 'HOD', 'Electrician')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};
