const express = require('express');
const path = require('node:path');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const authRouter = require('./routers/auth-router');
const userRouter = require('./routers/user-router');
const categoryRouter = require('./routers/category-router');
const postRouter = require('./routers/post-router');
const commentRouter = require('./routers/comment-router');
const notificationRouter = require('./routers/notification-router');
const leaderboardRouter = require('./routers/leaderboard-router');
const errorHandler = require('./middleware/error-middleware');
const { globalLimiter } = require('./middleware/rate-limiter-middleware');
const { NotFoundError } = require('./utils/error');
const { closeAllPostClients } = require('./utils/post-events');
const setupAdmin = require('./admin');

const cors = require('cors');
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(pinoHttp({ logger }));
app.use(express.json());

app.use('/api', globalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/posts', postRouter);
app.use('/api/comments', commentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/leaderboard', leaderboardRouter);

(async () => {
  await setupAdmin(app);

  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  const server = app.listen(port, () => {
    logger.info(`Server is listening at: http://localhost:${port}`);
  });

  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);

  let shuttingDown = false;

  function shutDown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(signal + ' received. Shutting down gracefully...');

    closeAllPostClients();

    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });

    server.closeAllConnections();

    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout.');
      process.exit(1);
    }, 5000).unref();
  }
})();
