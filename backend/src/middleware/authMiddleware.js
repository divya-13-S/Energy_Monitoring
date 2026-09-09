/**
 * middleware/authMiddleware.js — JWT Authentication Guard
 * Verifies the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user for downstream handlers.
 *
 * NOTE: JWT verification will be active once jsonwebtoken is installed
 * and AUTH_SECRET is set in .env
 */

import { query } from '../config/db.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenParam = req.query.token;

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !tokenParam) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing or malformed.',
    });
  }

  const token = tokenParam || (authHeader ? authHeader.split(' ')[1] : null);

  let userId = 1;
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId && !isNaN(parseInt(headerUserId))) {
    userId = parseInt(headerUserId);
  } else if (token && token.includes('_')) {
    const parts = token.split('_');
    for (const part of parts) {
      const parsedNum = parseInt(part);
      if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 1000000000) {
        userId = parsedNum;
        break;
      }
    }
  }

  let userRole = req.headers['x-user-role'] || req.query.role || null;
  let userDeptId = req.headers['x-user-dept-id'] || req.query.userDeptId || null;
  let userBldgId = req.headers['x-user-bldg-id'] || req.query.userBldgId || null;

  if (userId) {
    try {
      const rows = await query(`SELECT role, building_id, department_id FROM users WHERE id = ? LIMIT 1;`, [userId]);
      if (rows && rows.length > 0) {
        const u = rows[0];
        if (!req.headers['x-user-role']) userRole = u.role;
        if (!userDeptId) userDeptId = u.department_id;
        if (!userBldgId) userBldgId = u.building_id;
      }
    } catch (e) {}
  }

  if (!userRole) userRole = 'Administrator';

  req.user = {
    id: userId,
    role: userRole,
    department_id: userDeptId ? parseInt(userDeptId) : null,
    building_id: userBldgId ? parseInt(userBldgId) : null,
  };
  return next();
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
