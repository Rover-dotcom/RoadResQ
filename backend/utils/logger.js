/**
 * Winston Logger — RoadResQ v9.0.0 (Week 7)
 *
 * Structured JSON logging for Cloud Functions.
 *
 * Usage:
 *   const { logger, httpLogger } = require('../utils/logger');
 *   logger.info('Job created', { jobId, userId });
 *   logger.payment('DEPOSIT', { userId, amount });
 *   app.use(httpLogger);
 */

const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

// ─── Logger Instance ─────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'roadresq-api', version: '9.0.0' },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 2
                ? ` ${JSON.stringify(meta, null, 0)}`
                : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          ),
    }),
  ],
});

// ─── Domain-Specific Log Helpers ─────────────────────────────────────────────

logger.payment = (action, data = {}) => {
  logger.info(`[Payment] ${action}`, { domain: 'payment', action, ...data });
};

logger.fraud = (action, data = {}) => {
  logger.warn(`[Fraud] ${action}`, { domain: 'fraud', action, ...data });
};

logger.auth = (action, data = {}) => {
  logger.info(`[Auth] ${action}`, { domain: 'auth', action, ...data });
};

logger.admin = (action, data = {}) => {
  logger.info(`[Admin] ${action}`, { domain: 'admin', action, ...data });
};

logger.driver = (action, data = {}) => {
  logger.info(`[Driver] ${action}`, { domain: 'driver', action, ...data });
};

logger.notification = (action, data = {}) => {
  logger.info(`[Notification] ${action}`, { domain: 'notification', action, ...data });
};

// ─── HTTP Request Logger Middleware ──────────────────────────────────────────

const httpLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode}`, logData);
    } else {
      logger.http(`${req.method} ${req.path} ${res.statusCode}`, logData);
    }
  });

  next();
};

module.exports = { logger, httpLogger };
