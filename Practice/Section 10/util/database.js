const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'nodecomplete',
    password: 'kartik1998@'
});

module.exports = pool.promise();