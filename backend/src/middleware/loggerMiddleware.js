/**
 * middleware/loggerMiddleware.js — HTTP Request Logger
 * Logs method, URL, status, and response time for every request.
 */

export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 500 ? '\x1b[31m' // red
      : res.statusCode >= 400 ? '\x1b[33m' // yellow
      : res.statusCode >= 200 ? '\x1b[32m' // green
      : '\x1b[37m'; // white

    console.log(
      `${statusColor}[${new Date().toISOString()}]\x1b[0m ${method} ${url} ${res.statusCode} — ${duration}ms (${ip})`
    );
  });

  next();
};
