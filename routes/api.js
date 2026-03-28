const router = require('express').Router();

module.exports = (pool) => {
	router.get('/api/demonlist', (req, res) => {
		const query = `
			SELECT
				d.*,
				p_pub.player_id AS publisher_id,
				p_pub.player_name AS publisher_name,
				p_ver.player_id AS verifier_id,
				p_ver.player_name AS verifier_name,
				GROUP_CONCAT(DISTINCT CONCAT(p_all.player_id, ':', p_all.player_name) ORDER BY p_all.player_name SEPARATOR '|') AS creator_data,
				GROUP_CONCAT(DISTINCT CONCAT(p_vic.player_id, ':', p_vic.player_name, ':', r.progress) ORDER BY r.progress DESC, p_vic.player_name ASC SEPARATOR '|') AS victor_data
			FROM demonlist d
			LEFT JOIN creators c ON d.level_id = c.level_id
			LEFT JOIN players p_all ON c.player_id = p_all.player_id
			LEFT JOIN creators c_pub ON d.level_id = c_pub.level_id AND c_pub.is_publisher = 1
			LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
			LEFT JOIN records r_ver ON d.level_id = r_ver.level_id AND r_ver.is_verifier = 1
			LEFT JOIN players p_ver ON r_ver.player_id = p_ver.player_id
			LEFT JOIN records r ON d.level_id = r.level_id AND r.is_verifier = 0
			LEFT JOIN players p_vic ON r.player_id = p_vic.player_id
			GROUP BY d.level_id
			ORDER BY d.placement ASC
		`;

		pool.query(query, (err, results) => {
			if (err) {
				console.error('Database Error:', err.sqlMessage);
				return res.status(500).json({ error: 'Database error', details: err.sqlMessage });
			}

			const formattedResults = results.map(row => {
				const creators = row.creator_data ? row.creator_data.split('|').map(c => {
					const [id, name] = c.split(':');
					return { playerID: parseInt(id), name: name };
				}) : [];

				const victors = row.victor_data ? row.victor_data.split('|').map(v => {
					const [playerID, name, progress] = v.split(':');
					return { playerID: parseInt(playerID), name: name, progress: parseInt(progress) };
				}) : [];

				const { creator_names, victor_data, ...rest } = row;

				return {
					levelID: row.level_id,
					placement: row.placement,
					levelName: row.level_name,
					creators: creators,
					publisher: { playerID: row.publisher_id, name: row.publisher_name },
					verifier: { playerID: row.verifier_id, name: row.verifier_name },
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

	router.get('/api/stats_viewer', (req, res) => {
		const query = `
			SELECT
				s.*,
				(SELECT GROUP_CONCAT(CONCAT(d2.level_id, '::', d2.placement, '::', d2.level_name, '::', p_pub.player_name, '::', r2.progress, '::', r2.is_verifier, '::', d2.points, '::', d2.list_percentage_points) ORDER BY d2.placement ASC SEPARATOR '|')
				FROM records r2
				JOIN demonlist d2 ON r2.level_id = d2.level_id
				LEFT JOIN creators c_pub ON d2.level_id = c_pub.level_id AND c_pub.is_publisher = 1
				LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
				WHERE r2.player_id = s.player_id AND r2.progress > 0) AS all_records,
				(SELECT GROUP_CONCAT(CONCAT(d3.level_id, '::', d3.placement, '::', d3.level_name, '::', p_pub3.player_name) ORDER BY d3.placement ASC SEPARATOR '|')
				FROM creators c
				JOIN demonlist d3 ON c.level_id = d3.level_id
				LEFT JOIN creators c_pub3 ON d3.level_id = c_pub3.level_id AND c_pub3.is_publisher = 1
				LEFT JOIN players p_pub3 ON c_pub3.player_id = p_pub3.player_id
				WHERE c.player_id = s.player_id) AS levels_created
			FROM stats_viewer s
			ORDER BY s.points DESC, s.player_name ASC
		`;

		pool.query(query, (err, results) => {
			if (err) {
				console.error('SQL Error:', err.message);
				return res.status(500).json({ error: 'Database error' });
			}

			const formattedResults = results.map(row => {
				const allRecords = row.all_records ? row.all_records.split('|').map(item => {
					const [levelID, placement, name, publisher, progress, isVerifier, points, listPercentagePoints] = item.split('::');
					return {
						levelID: parseInt(levelID),
						placement: parseInt(placement),
						name: name,
						publisher: publisher,
						progress: parseInt(progress),
						isVerifier: isVerifier === '1',
						points: parseInt(points),
						listPercentagePoints: parseInt(listPercentagePoints),
					};
				}) : [];

				const created = row.levels_created ? row.levels_created.split('|').map(item => {
					const [levelID, placement, name, publisher] = item.split('::');
						return { levelID: parseInt(levelID), placement: parseInt(placement), name: name, publisher: publisher };
				}) : [];

				return {
					playerID: row.player_id,
					playerName: row.player_name,
					playerNationality: row.player_nationality,
					points: parseInt(row.points) || 0,
					mainList: parseInt(row.main_list) || 0,
					extendedList: parseInt(row.extended_list) || 0,
					legacyList: parseInt(row.legacy_list) || 0,
					levelsVerified: allRecords
						.filter(r => r.isVerifier)
						.map(({ levelID, placement, name, publisher, points }) => ({ levelID, placement, name, publisher, points })),
					levelsCompleted: allRecords
						.filter(r => !r.isVerifier && r.progress === 100)
						.map(({ levelID, placement, name, publisher, points }) => ({ levelID, placement, name, publisher, points })),
					progressOn: allRecords
						.filter(r => !r.isVerifier && r.progress < 100)
						.map(({ levelID, placement, name, publisher, progress, points, listPercentagePoints}) => ({ levelID, placement, name, publisher, progress, points, listPercentagePoints })),
					levelsCreated: created
				};
			});

			res.json(formattedResults);
		});
	});

	router.get('/api/totals', (req, res) => {
		const query = `
        SELECT 
            SUM(CASE WHEN list_type = 1 THEN 1 ELSE 0 END) AS total_main,
            SUM(CASE WHEN list_type = 2 THEN 1 ELSE 0 END) AS total_extended,
            SUM(CASE WHEN list_type = 3 THEN 1 ELSE 0 END) AS total_legacy
        FROM demonlist
    `;
		pool.query(query, (err, results) => {
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

	return router;
};
