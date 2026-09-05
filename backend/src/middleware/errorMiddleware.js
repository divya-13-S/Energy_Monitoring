/**
 * middleware/errorMiddleware.js — Global Error Handler
 * Catches all unhandled errors thrown inside route/controller handlers.
 */

export const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('\n❌ Error:', message);
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};
