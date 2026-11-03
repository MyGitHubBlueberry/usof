const { connectAsRoot, user, database, host } = require("./db-helper");

async function nuke() {
  let connection;
  try {
    connection = await connectAsRoot();
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`);
    await connection.query(`DROP USER IF EXISTS '${user}'@'${host}';`);
    console.log(`Successfully nuked database \`${database}\` and user '${user}'@'${host}'.`);
  } catch (err) {
    console.error("Failed to nuke the database: " + err.message);
  } finally {
    if (connection) await connection.end();
  }
}

nuke();
