# USOF
## About
### Description
This is a small web project that aims to recreate environment similar to Stack Overflow, where people can share their problems, suggest solutions, comments and more.
Project uses Express Node.js as backend foundation; underlying database is MySql;
To be more specific, users can create posts for different categories with attachments if any, react to them, write comments, like them as well, which influences user rating. Project features leader-board with weekly and all-time user rating which helps with user engagement. Users can subscribe to posts to receive notifications about changes in them, as about related comments. They can also feature certain posts for easier navigation. Filtering and searching is implemented as well.
From admin side, there are 2 distinct roles: admin and super admin, whose responsibility is to moderate users and their posts, and admins respectively, which made easily approachable through admin panel interface.
### Screenshots
[Server start](./docs/screenshots/project-start.jpg)
[Admin panel](./docs/screenshots/admin-panel.jpg)
### Requirements & Dependencies
#### System requirements
  - [Node.js](https://nodejs.org/) v22+
  - [MySQL](https://www.mysql.com/) v8+
  - npm (comes with Node.js)

#### Key packages (installed via `npm install`)

| Package | Purpose |
|---|---|
| [express](https://www.npmjs.com/package/express) v5 | Web framework |
| [mysql2](https://www.npmjs.com/package/mysql2) | MySQL driver (promise-based) |
| [bcrypt](https://www.npmjs.com/package/bcrypt) | Password hashing |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) | JWT auth tokens |
| [multer](https://www.npmjs.com/package/multer) | File uploads (avatars, attachments) |
| [nodemailer](https://www.npmjs.com/package/nodemailer) | Email sending (verification, password reset) |
| [adminjs](https://www.npmjs.com/package/adminjs) | Admin panel UI |
| [pino](https://www.npmjs.com/package/pino) | Structured logging |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) | Rate limiting |
| [cors](https://www.npmjs.com/package/cors) | Cross-origin requests |

### How to run
#### .env setup
First, you would need to create `.env` file since server is reliant on environment variables for sensitive data. You can copy on the `.env.example` file and replace placeholders with actual data values.
Variables with `DB_` prefix are database related. You can change user, password and database name as you please.
`DB_ROOT` prefixed variables require username and password (password is required for windows users; unix based systems use `sudo` for verification) your database manager user.
`_SECRET` variables should have random sequence of characters in them
`SMTP_` variables should have your Ethereal credentials. If you don't have any, generate a pair on their site: [ethereal.email](https://ethereal.email).
`SUPERADMIN` variables will be your credentials to access admin panel. Having a real email is not necessary.

Outside of production (`NODE_ENV !== 'production'`), responses from `/auth/register`, `/auth/resend-verification`, `/auth/password-reset`, and email-changing `PATCH /users/:user_id` requests include an extra `dev_link` field with the relative confirm/reset path. This lets you test the email-confirmation and password-reset flows locally without a working SMTP setup.
#### Install packages
Next on the agenda is to run `npm install` to install [dependencies](#key-packages-installed-via-npm-install)
#### db setup
After your `.env` file is ready, you can use `npm run db:recreate` in the `/server` directory to create a fresh database and then seed it. If you are a unix user, you might want to prefix this command with `sudo`.
There are more database commands you can explore for tinkering with the db. Inspect `package.json`'s script section for more options.
#### Project startup
When your database is ready, run `npm start` in /server directory to start the server.
Open [this link](http://localhot:3000/admin) to access the admin panel or use integrated admin pannel if you prefer to keep centralized.

#### Test credentials
Seeding the database (`npm run db:recreate`) creates these accounts (password is `password123` for all):

| Login | Role | Email | Password | Description |
|---|---|---|---|---|
| `superadmin` | `superadmin` | `superadmin@example.com` | `password123` | Full access: create users with roles, delete users, edit roles. |
| `admin` | `admin` | `admin@example.com` | `password123` | Post/comment moderation, category CRUD, user bans & ban history. |
| `user` | `user` | `user@example.com` | `password123` | Standard member: posts, comments, reactions, favorites, subscriptions. |

The `superadmin` account is additionally (re-)created/updated on every seed run from the `SUPERADMIN_LOGIN`/`SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` variables in `.env` (see `seed.js`), so keep those in sync if you change them.
## Docs
### DB
#### Basic
First db design includes users table with all necessary details; comments table, which is used for storing comments on posts as well as comments replies; posts table with separate subtables for attachments and categories, so multiple of those can be associated with one post without breaking 1NF;
Login, email, category and post titles are uniquely identified to prevent duplication; Db stores attachment and profile picture paths instead of the actual files.
[DB schema](./docs/screenshots/db-schema-basic.png)
#### Creative
In creative part user_bans, notifications, post_subscriptions, favorite_posts were added.
User table was extended with tokens.
[DB schema](./docs/screenshots/db-schema-creative.png)
### Backend
In backend, let's cover request flow:
* Request is fired
  - If request is addressed to a valid endpoint, it is caught by a router, one of under `/server/routers` ; they are all registered in `index.js`.
  - Else, request is caught by `catch all` handler at the end and server returns 404.
* In router, every route has at least one middleware attached to it; they serve different purposes. Some validate data, some attach it.
  - If middleware encounters inconsistency, a required missing field, invalid type or can't fetch required data it throws an appropriate error and returns corresponding error code with useful details about what went wrong.
  - Else, middleware finishes and passes execution through `next()` to the next middleware or to the controller if it was the last in line.
* Controller receives request and response objects
* It get's data from the request object, passes it to corresponding model method.
* Model method receives data, builds query and passes it to the database.
* Database fetches data according to the query and returns it to the caller.
* Model returns the data to the controller
* Controller does required operations on received data and updates the db again through the model (if required) and attaches data to the response object.
* And router fires the response back.

### API Endpoints

All endpoints are prefixed with `/api`. A global rate limiter applies to all `/api` routes. Pagination query params (`page`, `limit`) are available where noted.

#### Authentication — `/api/auth`

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `POST` | `/register` | No | `login`, `email`, `password`, `confirmed_password`, `full_name` | Register a new user. Sends verification email. Rate-limited. |
| `POST` | `/resend-verification` | No | `email` | Resend email verification link. Rate-limited. |
| `POST` | `/login` | No | `login`, `password` | Login. Returns JWT token and user object. Rejects unverified or banned users. Rate-limited. |
| `POST` | `/confirm-email/:confirm_token` | No | `:confirm_token` (URL) | Confirm email using verification token from email link. |
| `POST` | `/password-reset` | No | `email` | Request a password reset email. Rate-limited. |
| `POST` | `/password-reset/:confirm_token` | No | `new_password`, `:confirm_token` (URL) | Reset password using token from email. Rate-limited. |
| `POST` | `/logout` | Yes | — | Logout (client-side token invalidation). |

#### Users — `/api/users`

`GET /:user_id`, `GET /:user_id/avatar`, and `GET /search` are public (optional auth); every other route requires authentication.

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/` | Admin+ | Query: `page`, `limit`, `sortBy`, `order`, `search` (matches login/email), `role`, `status` (`active`/`banned`) | Get all users (paginated), each row annotated with `is_banned`/`active_ban`. |
| `POST` | `/` | Superadmin | `login`, `email`, `password`, `confirmed_password`, `full_name`, `role` | Create a new user with a specific role. Always marked email-confirmed. |
| `DELETE` | `/` | Yes | — | Delete own account (no confirmation step). |
| `PATCH` | `/avatar/` | Yes | Multipart: `avatar` (file, max 5MB, images only) | Upload/replace own avatar; deletes the previous file if present. |
| `DELETE` | `/avatar/` | Yes | — | Delete own avatar. |
| `GET` | `/bans/log` | Admin+ | Query: `page`, `limit`, `search`, `status` (`active`/`expired`/`unbanned`), `targetUser`, `bannedBy`, `sortBy`, `order`, `dateFrom`, `dateTo` | Get the full ban log across all users (paginated). Route is declared before `/:user_id` so `bans` isn't parsed as an ID. |
| `GET` | `/search` | No | Query: `q`, `limit` (max 20, default 8) | Prefix-match usernames (`login LIKE 'q%'`) for search-as-you-type autocomplete. Returns `id`/`login`/`profile_picture_path` only, no email matching (avoids an email-enumeration oracle). Route declared before `/:user_id` so `search` isn't parsed as an ID. |
| `GET` | `/:user_id` | Optional | `:user_id` (URL) | Get a user's public profile (sensitive fields stripped). Public so anonymous viewers can resolve post/comment authors. |
| `PATCH` | `/:user_id` | Owner/Admin+ | `login`?, `email`?, `password`?, `full_name`? | Update profile fields (partial). Changing `email` resets `is_email_confirmed` and re-sends a verification email. |
| `PATCH` | `/:user_id/role` | Superadmin | `role` (`user`/`admin`/`superadmin`) | Change a user's role. Cannot target your own account. |
| `PATCH` | `/:user_id/ban` | Admin+ | `ban` (boolean), `reason`?, `expires_at`? | Ban or unban a user. Cannot target your own account or an account with equal/higher role authority. |
| `GET` | `/:user_id/ban` | Admin+ | `:user_id` (URL) | Get ban history for one user. |
| `DELETE` | `/:user_id` | Superadmin | `:user_id` (URL) | Delete a user by ID. |
| `GET` | `/:user_id/avatar` | Optional | `:user_id` (URL) | Serve a user's avatar image file. Public — avatars are non-sensitive. |
| `DELETE` | `/:user_id/avatar` | Owner/Admin+ | `:user_id` (URL) | Delete a user's avatar. |

#### Posts — `/api/posts`

Public `GET` routes use optional authentication (to determine access to inactive posts). Write operations require authentication. List endpoints (`/`, `/favorites`, `/subscriptions`) share the same query params: `page`, `limit`, `sortBy` (`publish_date`/`likes`/etc., default `likes`), `order` (`asc`/`desc`, default `desc`), `status` (`active`/`inactive`/`resolved` — `inactive` restricted to the post's own author/admin), `categories` or `category` (single category title), `author` (login or email, resolved to a user), `dateFrom`, `dateTo`, `search` (matches title/content).

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/` | Optional | See shared list query params above | Get all posts (paginated), each annotated with author, categories, attachment list, like/dislike counts. |
| `GET` | `/favorites` | Yes | Shared list query params | Get current user's favorited posts, default-sorted by `favorited_at`. |
| `GET` | `/subscriptions` | Yes | Shared list query params | Get posts the current user is subscribed to, default-sorted by `subscribed_at`. |
| `GET` | `/:post_id` | Optional | `:post_id` (URL) | Get a single post with its attachments. Inactive posts restricted to author/admin. |
| `GET` | `/:post_id/events` | Optional | `:post_id` (URL) | Server-Sent Events stream (`text/event-stream`) emitting `post_updated`, `likes_updated`, `comments_updated`, and `comment_like_updated` events for real-time updates on this post and its comments. |
| `GET` | `/:post_id/attachments/:filename` | Optional | `:post_id`, `:filename` (URL) | Download a post attachment file. |
| `GET` | `/:post_id/comments` | Optional | `:post_id` (URL), `page`, `limit` | Get comments for a post (paginated). Content of inactive comments is nulled out for non-owner/non-admin viewers. |
| `GET` | `/:post_id/categories` | Optional | `:post_id` (URL) | Get categories assigned to a post. |
| `GET` | `/:post_id/like` | Optional | `:post_id` (URL) | Get `{ likes, dislikes, myReaction }` for a post (`myReaction` is `null` when unauthenticated or unreacted). |
| `POST` | `/` | Yes | Multipart: `title`, `content`, `categories[]`? (must already exist), `attachments`? (files, max 10) | Create a new post with optional categories and file attachments. Rejects duplicate titles. |
| `POST` | `/:post_id/comments` | Yes | `content` | Add a top-level comment to a post. Blocked on inactive posts. Broadcasts `comments_updated` and notifies subscribers. |
| `POST` | `/:post_id/like` | Yes | `type` (`like` or `dislike`) | React to a post. Replaces any existing reaction and recalculates the author's rating. Blocked on inactive posts. |
| `PATCH` | `/:post_id` | Post Owner | Multipart: `title`?, `content`?, `categories[]`?, `attachments`? (files) | Update a post. Blocked on inactive/resolved posts. Broadcasts `post_updated` and notifies subscribers. |
| `PATCH` | `/:post_id/status` | Admin+ | `status` (`active` or `inactive` — `resolved` is not settable via this route) | Change post status. Notifies subscribers of the change. |
| `DELETE` | `/:post_id` | Post Owner/Admin+ | `:post_id` (URL) | Delete a post, cascading comments/likes/attachments and removing attachment files from disk. |
| `DELETE` | `/:post_id/attachments/:filename` | Post Owner | `:post_id`, `:filename` (URL) | Remove a single attachment from a post and delete its file. Blocked on inactive/resolved posts. |
| `DELETE` | `/:post_id/like` | Yes | `:post_id` (URL) | Remove own reaction from a post and recalculate the author's rating. |
| `POST` | `/:post_id/favorite` | Yes | `:post_id` (URL) | Add post to favorites (409 if already favorited). |
| `DELETE` | `/:post_id/favorite` | Yes | `:post_id` (URL) | Remove post from favorites. |
| `POST` | `/:post_id/subscribe` | Yes | `:post_id` (URL) | Subscribe to post notifications (409 if already subscribed). |
| `DELETE` | `/:post_id/subscribe` | Yes | `:post_id` (URL) | Unsubscribe from post notifications. |

#### Comments — `/api/comments`

Public `GET` routes use optional authentication. Write operations require authentication.

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/:comment_id` | Optional | `:comment_id` (URL) | Get a single comment. Restricted if the parent post's status disallows viewing. |
| `GET` | `/:comment_id/like` | Optional | `:comment_id` (URL) | Get like/dislike counts for a comment. |
| `POST` | `/:comment_id/like` | Yes | `type` (`like` or `dislike`) | React to a comment. |
| `POST` | `/:comment_id/reply` | Yes | `content` | Reply to a comment, setting `parent_comment_id` (threaded, any depth). Blocked on inactive/resolved posts. |
| `PATCH` | `/:comment_id` | Comment Owner | `content` | Edit own comment. Blocked on inactive/resolved posts. |
| `PATCH` | `/:comment_id/resolve` | Post Owner/Admin+ | — | Mark a comment (and sync the parent post) as resolved. Blocked on inactive/resolved posts. |
| `PATCH` | `/:comment_id/status` | Admin+ | `status` (`active` or `inactive` — `resolved` is not settable via this route) | Change comment status. |
| `DELETE` | `/:comment_id` | Comment Owner/Admin+ | `:comment_id` (URL) | Delete a comment and its replies. Blocked on inactive/resolved posts. |
| `DELETE` | `/:comment_id/like` | Yes | `:comment_id` (URL) | Remove own reaction from a comment. Blocked on inactive/resolved posts. |

#### Categories — `/api/categories`

Public `GET` routes require no authentication. Write operations require admin role.

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/` | No | `page`, `limit`, `search` | Get all categories (paginated). |
| `GET` | `/:category_id` | No | `:category_id` (URL) | Get a single category. |
| `GET` | `/:category_id/posts` | No | `:category_id` (URL), `page`, `limit` | Get all posts in a category (paginated). |
| `POST` | `/` | Admin+ | `title`, `description`? | Create a new category. |
| `PATCH` | `/:category_id` | Admin+ | `title`?, `description`? (partial) | Update a category. |
| `DELETE` | `/:category_id` | Admin+ | `:category_id` (URL) | Delete a category. |

#### Leaderboard — `/api/leaderboard`

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/` | Optional | `page`, `limit` | Get overall leaderboard ranked by total user rating, descending. |
| `GET` | `/weekly` | Optional | `page`, `limit` | Get weekly leaderboard ranked by rating gained this week, descending. |

#### Notifications — `/api/notifications`

All notification routes require authentication. Notifications are generated when subscribed posts are updated, commented on, or have their status changed.

| Method | Path | Auth | Body / Params | Description |
|--------|------|------|---------------|-------------|
| `GET` | `/` | Yes | `page`, `limit` | Get current user's notifications (paginated, newest first). |
| `GET` | `/unread-count` | Yes | — | Get `{ unreadCount }` for the current user. |
| `PATCH` | `/read-all` | Yes | — | Mark all of the current user's notifications as read. |
| `PATCH` | `/:notification_id/read` | Yes | `:notification_id` (URL) | Mark a single notification as read. |
| `DELETE` | `/` | Yes | — | Delete all of the current user's notifications. |
| `DELETE` | `/:notification_id` | Yes | `:notification_id` (URL) | Delete a single notification. |

#### Admin Panel

| Path | Auth | Description |
|------|------|-------------|
| `/admin` | Cookie-based (admin credentials) | AdminJS panel for managing users, posts, comments, categories, bans, and more. |
## CBL progress

See [`docs/CBL.md`](./docs/CBL.md) for the full Engage/Investigate/Act/Creative reflection.
