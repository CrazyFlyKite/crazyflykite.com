const express = require('express');
const router = express.Router();

const TABLES = {
	demonlist: 'demonlist'
};

module.exports = (connection) => {
	router.get('/data/:list', (req, res) => {
		const listName = req.params.list;
		const table = TABLES[listName];

		if (!table) return res.status(404).json({ error: 'List not found' });
		connection.query(
			'SELECT * FROM ?? ORDER BY placement ASC',
			[table],
			(err, results) => {
				if (err) {
					console.error(err);
					return res.status(500).json({ error: 'Database error' });
				}

				const parsedResults = results.map(row => {
					let creators = row.creators;
					let victors = row.victors;

					try {
						if (typeof creators === 'string') creators = JSON.parse(creators);
						if (typeof victors === 'string') victors = JSON.parse(victors);
					} catch (e) {
						console.error('Error parsing JSON columns:', e);
					}

					return {
						...row,
						creators: Array.isArray(creators) ? creators : [],
						victors: Array.isArray(victors) ? victors : []
					};
				});

				res.json(parsedResults);
			}
		);
	});

	return router;
};
