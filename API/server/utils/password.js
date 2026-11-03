const bcrypt = require('bcrypt');

async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

async function passwordsMatch(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = {
  hashPassword,
  passwordsMatch
};
