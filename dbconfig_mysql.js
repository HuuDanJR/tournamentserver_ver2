let mysql = require('mysql');

const config_mysql = {
    user: 'root',
    password: '',
    database:'roulettetournament',
    host: '30.0.0.53',
    // host: '192.168.100.71',
    port: 3306,
    connectTimeout: 20000,
}

const connection = mysql.createPool(config_mysql)

// Attempt to connect to the database (optional)
connection.getConnection((err, conn) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database!');
  // Don't forget to release the connection when you're done with it
  conn.release();
});


module.exports = connection;