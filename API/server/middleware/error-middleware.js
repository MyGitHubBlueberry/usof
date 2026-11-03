const logger = require('../utils/logger');
const multer = require('multer');

module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const logContext = { err, method: req.method, url: req.originalUrl, userId: req.user?.id || null, ip: req.ip };
  
  if (err.isOperational) {
    logger.warn(logContext, err.message);
  } else {
    logger.error(logContext, err.message);
  }
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }

  if (err.isOperational) {
    const response = { error: err.message };

    if (err.details && err.details.length > 0) {
      response.details = err.details;
    }

    if (err.data) {
      Object.assign(response, err.data);
    }

    return res.status(status).json(response);
  }
  return res.status(500).json({ error: 'Internal server error'})
}
