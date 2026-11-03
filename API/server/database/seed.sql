USE usof;

-- Passwords hash corresponds to 'password123'
INSERT IGNORE INTO users (id, login, password, full_name, email, rating, role, is_email_confirmed)
VALUES
  (1, 'user', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Regular User', 'user@example.com', 10, 'user', TRUE),
  (2, 'star', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Sviat Nekrasov', 'starstar@gmail.com', 20, 'user', TRUE),
  (3, 'superadmin', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Super Admin', 'superadmin@example.com', 30, 'superadmin', TRUE),
  (4, 'son', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'David Goggins', 'goggins@gmail.com', 100, 'user', TRUE),
  (5, 'admin', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Admin User', 'admin@example.com', 100, 'admin', TRUE),
  (6, 'jane', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Jane Doe', 'jane@example.com', 0, 'user', TRUE),
  (7, 'john', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'John Smith', 'john@example.com', -5, 'user', TRUE),
  (8, 'botuser', '$2b$10$0NaM4TF38HbIIpk90TDT3O9uCa1UBB1ScAwqHeuVQuuPaS4DLVFZO', 'Automated Bot', 'bot@example.com', 0, 'user', FALSE);

INSERT IGNORE INTO categories (id, title, description)
VALUES
  (1, 'Node.js', 'All questions about Node.js runtime and asynchronous I/O'),
  (2, 'Express', 'Express.js framework, routing, and middleware'),
  (3, 'MySQL', 'Database design, SQL queries, and performance optimization'),
  (4, 'JavaScript', 'Core JS concepts, ES6+, promises, and async/await'),
  (5, 'General', 'General web development discussions and announcements');

INSERT IGNORE INTO posts (id, user_id, title, content, status)
VALUES
  (1, 1, 'How to use async/await with MySQL pool in Express?', 'I am building an express app and want to know how to properly handle pool connections with async/await.', 'active'),
  (2, 2, 'Best practices for password hashing in Node.js', 'Should I use bcrypt or argon2 for hashing passwords in my USOF project?', 'active'),
  (3, 3, 'Understanding MVC Architecture in Node backend', 'Could someone explain how controllers and models should interact in an Express app?', 'resolved'),
  (4, 4, 'Handling file uploads with Multer', 'What is the cleanest way to store avatars locally on disk and save their path in MySQL?', 'active'),
  (5, 5, 'Welcome to USOF Q&A Platform!', 'This is an official administrative post introducing the USOF platform rules and guidelines.', 'active'),
  (6, 1, 'Debugging connection leaks in mysql2 driver', 'Drafting troubleshooting tips for pool release failures under heavy asynchronous loads.', 'inactive');

INSERT IGNORE INTO post_attachments (post_id, attachment_path)
VALUES
  (1, 'uploads/attachments/post1-pool-diagram.png'),
  (1, 'uploads/attachments/post1-express-middleware-flow.pdf'),
  (2, 'uploads/attachments/bcrypt-vs-argon2-benchmark.png'),
  (3, 'uploads/attachments/mvc-architecture-blueprint.svg'),
  (4, 'uploads/attachments/multer-disk-storage-config.js');

INSERT IGNORE INTO post_categories (post_id, category)
VALUES
  (1, 'Node.js'),
  (1, 'MySQL'),
  (2, 'Node.js'),
  (3, 'Express'),
  (4, 'Node.js'),
  (5, 'General'),
  (6, 'MySQL');

INSERT IGNORE INTO comments (id, user_id, post_id, parent_comment_id, content, status)
VALUES
  (1, 2, 1, NULL, 'You should use `mysql2/promise` pool and wrap queries inside async function blocks.', 'active'),
  (2, 1, 1, 1,    'Thanks @star! Does mysql2 automatically release connections back to pool when using pool.query()?', 'active'),
  (3, 5, 2, NULL, 'Bcrypt with a salt factor of 10 is standard and works great in Node.js.', 'active'),
  (4, 3, 3, NULL, 'Models encapsulate database queries, while controllers manage request validation and HTTP responses.', 'active'),
  (5, 4, 5, NULL, 'Glad to be here! Looking forward to contributing to USOF.', 'active'),
  (6, 2, 4, NULL, 'Make sure to configure file extension filtering and size limits in Multer middleware.', 'active');

INSERT IGNORE INTO likes (id, user_id, post_id, comment_id, type)
VALUES
  (1, 2, 1, NULL, 'like'),
  (2, 3, 1, NULL, 'like'),
  (3, 1, NULL, 1, 'like'),
  (4, 4, 2, NULL, 'like'),
  (5, 5, NULL, 2, 'like'),
  (6, 3, 4, NULL, 'dislike');

INSERT IGNORE INTO post_subscriptions (user_id, post_id)
VALUES
  (2, 1),
  (3, 1),
  (1, 2),
  (4, 2),
  (1, 5),
  (3, 5);

INSERT IGNORE INTO favorite_posts (user_id, post_id)
VALUES
  (1, 2),
  (2, 1),
  (3, 4),
  (4, 5),
  (1, 5);

INSERT IGNORE INTO user_bans (id, user_id, banned_by, reason, banned_at, expires_at, unbanned_at)
VALUES
  (1, 6, 5, 'Spamming repetitive questions in Node.js category', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NULL),
  (2, 7, 5, 'Inappropriate language in post comments', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL),
  (3, 8, 5, 'Automated bot activity detected', NOW(), NULL, NULL),
  (4, 1, 5, 'Temporary suspension for testing', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (5, 2, 5, 'Warning for policy violation', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), NULL);
