const session = require('express-session');
const { host, port, user, password, database } = require('./database/db-helper');
const DbUser = require('./models/user-model');
const { passwordsMatch } = require('./utils/password');
const { ROLES, ROLE_LEVELS } = require('./utils/constants');
const logger = require('./utils/logger');

const COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET || process.env.JWT_SECRET;

async function authenticate(email, plainPassword) {
  const dbUser = await DbUser.findByEmailOrLogin(email);
  if (!dbUser) return null;

  const isAdmin = (ROLE_LEVELS[dbUser.role] ?? 0) >= ROLE_LEVELS[ROLES.ADMIN];
  if (!isAdmin) return null;

  const valid = await passwordsMatch(plainPassword, dbUser.password);
  if (!valid) return null;

  return { email: dbUser.email, id: dbUser.id, role: dbUser.role };
}

async function setupAdmin(app) {
  try {
    const { default: AdminJS } = await import('adminjs');
    const AdminJSExpress = await import('@adminjs/express');
    const { Adapter, Database, Resource } = await import('@adminjs/sql');

    AdminJS.registerAdapter({ Database, Resource });

    const db = await new Adapter('mysql2', {
      host, port, user, password, database
    }).init();

    const admin = new AdminJS({
      databases: [db],
      rootPath: '/admin',
      branding: {
        companyName: 'USOF Admin',
        logo: false,
        softwareBrothers: false,
      },
      resources: [
        {
          resource: db.table('users'),
          options: {
            properties: {
              password: { isVisible: false },
              email_verification_token: { isVisible: { list: false, show: true, edit: false, filter: false } },
              password_reset_token: { isVisible: false },
              password_reset_token_expires: { isVisible: false },
            },
            listProperties: ['id', 'login', 'full_name', 'email', 'rating', 'role', 'is_email_confirmed'],
          },
        },
        {
          resource: db.table('posts'),
          options: {
            listProperties: ['id', 'user_id', 'title', 'status', 'publish_date'],
          },
        },
        {
          resource: db.table('comments'),
          options: {
            listProperties: ['id', 'user_id', 'post_id', 'status', 'publish_date'],
          },
        },
        {
          resource: db.table('categories'),
          options: {
            listProperties: ['id', 'title', 'description'],
          },
        },
        {
          resource: db.table('likes'),
          options: {
            listProperties: ['id', 'user_id', 'post_id', 'comment_id', 'type', 'publish_date'],
          },
        },
        {
          resource: db.table('user_bans'),
          options: {
            listProperties: ['id', 'user_id', 'banned_by', 'reason', 'banned_at', 'expires_at'],
          },
        },
        {
          resource: db.table('notifications'),
          options: {
            listProperties: ['id', 'user_id', 'post_id', 'type', 'is_read', 'created_at'],
          },
        },
      ],
    });

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      admin,
      {
        authenticate,
        cookiePassword: COOKIE_SECRET,
      },
      null,
      {
        resave: false,
        saveUninitialized: false,
        secret: COOKIE_SECRET,
      }
    );

    app.use(admin.options.rootPath, adminRouter);

    const serverPort = process.env.PORT || 3000;
    logger.info(`AdminJS panel available at: http://localhost:${serverPort}${admin.options.rootPath}`);
  } catch (err) {
    logger.error(err, 'Failed to initialize AdminJS — admin panel will be unavailable');
  }
}

module.exports = setupAdmin;

