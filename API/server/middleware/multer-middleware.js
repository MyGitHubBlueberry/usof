const multer = require('multer');
const assert = require('node:assert');
const { ValidationError } = require('../utils/error');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const avatarDir = path.join(__dirname, '../../uploads/avatars');
const attachmentDir = path.join(__dirname, '../../uploads/attachments');
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(attachmentDir, { recursive: true });

const avatarUpload = multer({
  dest: avatarDir,
  limits: {
    files: 1,
    fileSize: 8_000_000,  // 8mb
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname.toLowerCase());
    if (!file.mimetype.startsWith('image/') || !allowedExtensions.includes(ext)) {
      return cb(
        new ValidationError('Validation failed', [{
          field: file.fieldname,
          message: `Invalid file type '${ext}'. ` +
            `Only image files (${allowedExtensions.join(' ')}) ` +
            "are allowed for avatars."
        }])
      );
    }
    return cb(null, true);
  }
});

const attachmentStorage = multer.diskStorage({
  destination: attachmentDir,
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    files: 10,
    fileSize: 10_000_000
  }
});

module.exports = {
  avatarUpload,
  attachmentUpload,
  avatarDir,
  attachmentDir
};
