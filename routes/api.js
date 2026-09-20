const router = require('express').Router();
const { getFormattedLevels } = require('../services/levelService');
const { getFormattedPlayers } = require('../services/playerService');

module.exports = (pool) => {
	router.get('/api/lists', (req, res) => {
		pool.query(`
			SELECT list_id AS listId, list_name AS listName, display_name AS displayName
			FROM lists
			ORDER BY list_id
		`, (err, rows) => {
			if (err) return res.status(500).json({ error: err.message })
			res.json(rows)
		})
	})

	router.get('/api/lists/:listId/levels', async (req, res) => {
		try {
			res.json(await getFormattedLevels(pool, req.params.listId));
		} catch (err) {
			res.status(500).json({ error: 'Database error', details: err.message });
		}
	});

	router.get('/api/lists/:listId/players', async (req, res) => {
		try {
			res.json(await getFormattedPlayers(pool, req.params.listId));
		} catch (err) {
			res.status(500).json({ error: 'Database error', details: err.message });
		}
	});

	router.get('/api/lists/:listId/totals', (req, res) => {
		pool.query(`
			SELECT SUM(IF(list_type = 1, 1, 0)) AS main,
				   SUM(IF(list_type = 2, 1, 0)) AS extended,
				   SUM(IF(list_type = 3, 1, 0)) AS legacy
			FROM levels
			WHERE list_id = ?
		`, [req.params.listId], (err, rows) => {
			if (err) return res.status(500).json({ error: err.sqlMessage });
			res.json({
				main: parseInt(rows[0].main) || 0,
				extended: parseInt(rows[0].extended) || 0,
				legacy: parseInt(rows[0].legacy) || 0
			});
		});
	});

	return router;
};
