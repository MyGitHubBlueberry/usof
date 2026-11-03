const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs/promises');

const host = process.env.DB_HOST;
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER;
const database = process.env.DB_NAME;
const password = process.env.DB_PASS;
const rootUser = process.env.DB_ROOT_USER || 'root';
const rootPassword = process.env.DB_ROOT_PASSWORD || '';

function checkMissingEnv(requiredKeys = [
  "PORT", "DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "JWT_SECRET"
]) {
  const missing = requiredKeys.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn("Missing environment variables: ", missing.join(", "));
    process.exit(1);
  }
}

async function executeSql(fileName) {
  checkMissingEnv();

  let sql;
  try {
    const filePath = path.join(__dirname, fileName);
    sql = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error("Failed to read sql file: " + err.message);
    return;
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host, port, user, password, database,
      multipleStatements: true
    });
    await connection.query(sql);
    console.log(`Successfully executed ${fileName}`);
  } catch (err) {
    console.error("Failed to execute query:", err.code || err.message);
    return;
  } finally {
    if (connection) await connection.end();
  }
}

async function connectAsRoot() {
  checkMissingEnv();

  const config = { host, port, user: rootUser };

  if (process.platform === 'linux') {
    console.log('Using socket to connect; \'sudo\' is required...');
    config.socketPath = '/var/run/mysqld/mysqld.sock';
  } else {
    console.log('Using password to connect; \'DB_ROOT_PASSWORD\' is required...');
    config.password = rootPassword;
  }

  return await mysql.createConnection(config);
}

module.exports = {
  connectAsRoot,
  executeSql,
  checkMissingEnv,
  host,
  port,
  user,
  database,
  password,
  rootUser,
  rootPassword
};
