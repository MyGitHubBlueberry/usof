CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `login` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `profile_picture_path` VARCHAR(255),
  `rating` INT NOT NULL DEFAULT 0,
  `role` ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
  `is_email_confirmed` BOOLEAN NOT NULL DEFAULT FALSE,
  `email_verification_token` VARCHAR(255) DEFAULT NULL,
  `password_reset_token` VARCHAR(255) DEFAULT NULL,
  `password_reset_token_expires` DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) UNIQUE NOT NULL,
  `publish_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active', 'inactive', 'resolved') NOT NULL DEFAULT 'active',
  `content` TEXT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `post_attachments` (
  `post_id` INT NOT NULL,
  `attachment_path` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`post_id`, `attachment_path`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT
);

CREATE TABLE IF NOT EXISTS `post_categories` (
  `post_id` INT NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`post_id`, `category`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category`) REFERENCES `categories` (`title`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `publish_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content` TEXT DEFAULT NULL,
  `post_id` INT NOT NULL,
  `parent_comment_id` INT DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'resolved') NOT NULL DEFAULT 'active',
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `likes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `comment_id` INT,
  `post_id` INT,
  `publish_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` ENUM('like', 'dislike') NOT NULL DEFAULT 'like',
  FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK(
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS `user_bans` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `banned_by` INT DEFAULT NULL,
  `reason` VARCHAR(255),
  `banned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL,
  `unbanned_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`banned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `favorite_posts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `favorited_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  UNIQUE(`user_id`, `post_id`)
);

CREATE TABLE IF NOT EXISTS `post_subscriptions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `subscribed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  UNIQUE(`user_id`, `post_id`)
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `type` ENUM('post_updated', 'post_commented', 'post_status_changed') NOT NULL,
  `message` VARCHAR(512) NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
);
