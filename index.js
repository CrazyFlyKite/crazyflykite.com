require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
	host: process.env.HOST_IP || '127.0.0.1',
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: 'seagdps',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 10000
});

pool.getConnection((err, connection) => {
	if (err) {
		console.error('MySQL Pool Error:', err.message);
		process.exit(1);
	}
	console.log('Connected to MySQL');
	connection.release();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const listRoutes = require('./routes/lists');
app.use(listRoutes(pool));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
