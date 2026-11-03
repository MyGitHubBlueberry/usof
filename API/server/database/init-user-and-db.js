const { host, user, database, password, connectAsRoot } = require('./db-helper');

async function createDbAndUser() {
  let connection;
  try {
    connection = await connectAsRoot();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.query(`CREATE USER IF NOT EXISTS '${user}'@'${host}'
      IDENTIFIED BY '${password}';`);
    await connection.query(`GRANT ALL PRIVILEGES ON \`${database}\`.*
      TO '${user}'@'${host}';`);
    await connection.query("FLUSH PRIVILEGES;");
    console.log(`Created database \`${database}\` and user '${user}'@'${host}'
      successfully.`);
  } catch (err) {
    console.error("Failed to initialize db and user: ", err.message);
  } finally {
    if (connection) await connection.end();
  }
}

createDbAndUser();
