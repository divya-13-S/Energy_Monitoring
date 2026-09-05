/**
 * utils/apiResponse.js — Standardized API Response Helpers
 * Ensures all API responses follow a consistent JSON shape.
 */

/**
 * Send a success response.
 * @param {Response} res - Express response object
 * @param {*} data - Payload to send
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send an error response.
 * @param {Response} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*} errors - Optional error details
 */
export const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Send a paginated list response.
 */
export const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
};
