const router = require('express').Router()

module.exports = (pool) => {
	router.get('/api/lists', (req, res) => {
		pool.query(`
			SELECT
				list_id AS listId,
				list_name AS listName,
				display_name AS displayName
			FROM lists
			ORDER BY list_id ASC
		`, (err, rows) => {
			if (err) return res.status(500).json({ error: err.message })
			res.json(rows)
		})
	})

	router.get('/api/lists/:listId/levels', (req, res) => {
		const { listId } = req.params

		const query = `
			SELECT
				l.*,
				p_pub.player_id AS publisher_id,
				p_pub.player_name AS publisher_name,
				p_ver.player_id AS verifier_id,
				p_ver.player_name AS verifier_name,
				r_ver.percentage AS verifier_percentage,
				r_ver.time_spent AS verifier_time_spent,
				GROUP_CONCAT(DISTINCT CONCAT(p_all.player_id, '::', p_all.player_name) ORDER BY p_all.player_name SEPARATOR '|') AS creator_data,
				GROUP_CONCAT(DISTINCT CONCAT(p_vic.player_id, '::', p_vic.player_name, '::', COALESCE(r.percentage, -1), '::', COALESCE(r.time_spent, 'NULL')) ORDER BY r.percentage DESC, p_vic.player_name ASC SEPARATOR '|') AS victor_data
			FROM levels l
			LEFT JOIN creators c ON l.level_id = c.level_id
			LEFT JOIN players p_all ON c.player_id = p_all.player_id
			LEFT JOIN creators c_pub ON l.level_id = c_pub.level_id AND c_pub.is_publisher = 1
			LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
			LEFT JOIN records r_ver ON l.level_id = r_ver.level_id AND r_ver.is_verifier = 1
			LEFT JOIN players p_ver ON r_ver.player_id = p_ver.player_id
			LEFT JOIN records r ON l.level_id = r.level_id AND r.is_verifier = 0
			LEFT JOIN players p_vic ON r.player_id = p_vic.player_id
			WHERE l.list_id = ?
			GROUP BY l.level_id
			ORDER BY l.placement ASC
		`;

		pool.query(query, [listId], (err, results) => {
			if (err) {
				console.error('Database Error:', err.sqlMessage);
				return res.status(500).json({ error: 'Database error', details: err.sqlMessage });
			}

			const formattedResults = results.map(row => {
				const creators = row.creator_data ? row.creator_data.split('|').map(c => {
					const [playerId, playerName] = c.split('::');
					return { playerId: parseInt(playerId), playerName: playerName };
				}) : [];

				const victors = row.victor_data ? row.victor_data.split('|').map(v => {
					const [playerId, playerName, percentage, timeSpent] = v.split('::');
					return { playerId: parseInt(playerId), playerName: playerName, percentage: percentage === '-1' ? null : parseInt(percentage), timeSpent: timeSpent === 'NULL' ? null : timeSpent};
				}) : [];

				const { creator_names, victor_data, ...rest } = row;

				return {
					levelId: row.level_id,
					placement: row.placement,
					levelName: row.level_name,
					creators: creators,
					publisher: { playerId: row.publisher_id, playerName: row.publisher_name },
					verifier: { playerId: row.verifier_id, playerName: row.verifier_name, percentage: row.verifier_percentage, timeSpent: row.verifier_time_spent },
					difficulty: row.difficulty,
					rating: row.rating,
					hasThumbnail: row.has_thumbnail === 1,
					showcase: row.showcase,
					listPercentage: row.list_percentage,
					points: row.points,
					listPercentagePoints: row.list_percentage_points,
					listType: row.list_type,
					victors: victors
				};
			});

			res.json(formattedResults);
		});
	});

	router.get('/api/lists/:listId/players', (req, res) => {
		const { listId } = req.params
		
		const query = `
			SELECT
				s.*,
				(SELECT GROUP_CONCAT(CONCAT(l2.level_id, '::', l2.placement, '::', l2.level_name, '::', p_pub.player_name, '::', COALESCE(r2.percentage, -1), '::', COALESCE(r2.time_spent, 'NULL'), '::', r2.is_verifier, '::', l2.points, '::', l2.list_percentage_points)
				ORDER BY l2.placement ASC SEPARATOR '|')
				FROM records r2
				JOIN levels l2 ON r2.level_id = l2.level_id
				LEFT JOIN creators c_pub ON l2.level_id = c_pub.level_id AND c_pub.is_publisher = 1
				LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
				WHERE r2.player_id = s.player_id AND l2.list_id = s.list_id) AS all_records,
				(SELECT GROUP_CONCAT(CONCAT(l3.level_id, '::', l3.placement, '::', l3.level_name, '::', p_pub3.player_name) ORDER BY l3.placement ASC SEPARATOR '|')
				FROM creators c
				JOIN levels l3 ON c.level_id = l3.level_id
				LEFT JOIN creators c_pub3 ON l3.level_id = c_pub3.level_id AND c_pub3.is_publisher = 1
				LEFT JOIN players p_pub3 ON c_pub3.player_id = p_pub3.player_id
				WHERE c.player_id = s.player_id AND l3.list_id = s.list_id) AS levels_created
			FROM stats s
			WHERE s.list_id = ?
			ORDER BY s.points DESC, s.player_name ASC
		`;

		pool.query(query, [listId], (err, results) => {
			if (err) {
				console.error('SQL Error:', err.message);
				return res.status(500).json({ error: 'Database error' });
			}

			const formattedResults = results.map(row => {
				const allRecords = row.all_records ? row.all_records.split('|').map(item => {
					const [levelId, placement, levelName, publisher, percentage, timeSpent, isVerifier, points, listPercentagePoints] = item.split('::');
					return {
						levelId: parseInt(levelId),
						placement: parseInt(placement),
						levelName: levelName,
						publisher: publisher,
						percentage: percentage === '-1' ? null : parseInt(percentage),
						timeSpent: timeSpent === 'NULL' ? null : timeSpent,
						isVerifier: isVerifier === '1',
						points: parseInt(points),
						listPercentagePoints: parseInt(listPercentagePoints),
					};
				}) : [];

				const created = row.levels_created ? row.levels_created.split('|').map(item => {
					const [levelId, placement, levelName, publisher] = item.split('::');
					return { levelId: parseInt(levelId), placement: parseInt(placement), levelName: levelName, publisher: publisher };
				}) : [];


				return {
					playerId: row.player_id,
					playerName: row.player_name,
					playerNationality: row.is_banned ? null : row.player_nationality,
					isBanned: Boolean(row.is_banned),
					points: row.is_banned ? 0 : (parseInt(row.points) || 0),
					mainList: row.is_banned ? 0 : (parseInt(row.main_list) || 0),
					extendedList: row.is_banned ? 0 : (parseInt(row.extended_list) || 0),
					legacyList: row.is_banned ? 0 : (parseInt(row.legacy_list) || 0),
					levelsVerified: row.is_banned ? [] : allRecords
						.filter(r => r.isVerifier),
					levelsCompleted: row.is_banned ? [] : allRecords
						.filter(r => !r.isVerifier && (r.percentage === 100 || r.percentage === null)),
					progressOn: row.is_banned ? [] : allRecords
						.filter(r => !r.isVerifier && r.percentage !== null && r.percentage < 100),
					levelsCreated: row.is_banned ? [] : created
				};
			});

			res.json(formattedResults);
		});
	});

	router.get('/api/lists/:listId/totals', (req, res) => {
		const { listId } = req.params

		const query = `
			SELECT 
				SUM(CASE WHEN list_type = 1 THEN 1 ELSE 0 END) AS total_main,
				SUM(CASE WHEN list_type = 2 THEN 1 ELSE 0 END) AS total_extended,
				SUM(CASE WHEN list_type = 3 THEN 1 ELSE 0 END) AS total_legacy
			FROM levels
			WHERE list_id = ?
    	`;
		pool.query(query, [listId], (err, results) => {
			if (err) return res.status(500).json({ error: err.sqlMessage });
			const row = results[0];

			const formattedResults = {
				main: parseInt(row.total_main) || 0,
				extended: parseInt(row.total_extended) || 0,
				legacy: parseInt(row.total_legacy) || 0
			};

			res.json(formattedResults);
		});
	});

	return router
}
