const mysql = require('mysql2/promise');
const { host, user, password, database, port } = require('./db-helper');

module.exports = mysql.createPool({ host, user, password, database, port });
