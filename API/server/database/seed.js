const { executeSql } = require("./db-helper");
const pool = require("./db");
const { hashPassword } = require("../utils/password");

async function seed() {
  await executeSql("seed.sql");

  const { SUPERADMIN_LOGIN, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

  if (SUPERADMIN_LOGIN && SUPERADMIN_EMAIL && SUPERADMIN_PASSWORD) {
    try {
      const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);
      await pool.query(
        `INSERT INTO users (login, email, password, role, is_email_confirmed, full_name, rating)
         VALUES (?, ?, ?, 'superadmin', TRUE, 'Super Admin', 0)
         ON DUPLICATE KEY UPDATE
           email=VALUES(email),
           password=VALUES(password),
           role='superadmin',
           is_email_confirmed=TRUE`,
        [SUPERADMIN_LOGIN, SUPERADMIN_EMAIL, hashedPassword]
      );
      console.log(`Superadmin ${SUPERADMIN_LOGIN} created or updated.`);
    } catch (err) {
      console.error("Failed to seed superadmin:", err);
    }
  }

  process.exit(0);
}

seed();
