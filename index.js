require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

const connection = mysql.createConnection({
	host: process.env.HOST_IP || '127.0.0.1',
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: 'seagdps',
});

connection.connect(err => {
	if (err) {
		console.error('MySQL connection error:', err);
		process.exit(1);
	}
	console.log('Connected to MySQL');
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const listRoutes = require('./routes/lists');
app.use(listRoutes(connection));
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running at http://0.0.0.0:${PORT}`);
});
