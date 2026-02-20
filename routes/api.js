const router = require('express').Router();

module.exports = (pool) => {
	router.get('/api/demonlist', (req, res) => {
		const query = `
			SELECT
				d.*,
				p_pub.player_name AS publisher_name,
				p_ver.player_name AS verifier_name,
				GROUP_CONCAT(DISTINCT p_all.player_name ORDER BY p_all.player_name SEPARATOR ', ') AS creator_names,
				GROUP_CONCAT(
				DISTINCT CONCAT(p_vic.player_name, ':', r.progress) 
                ORDER BY r.progress DESC, p_vic.player_name ASC 
                SEPARATOR '|'
				) AS victor_data
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
				const creators = row.creator_names ? row.creator_names.split(', ') : [];

				const victors = row.victor_data ? row.victor_data.split('|').map(v => {
					const [name, progress] = v.split(':');
					return { name, '%': parseInt(progress) };
				}) : [];

				const { creator_names, victor_data, ...rest } = row;

				return {
					...rest,
					publisher: row.publisher_name || 'Unknown',
					verifier: row.verifier_name || 'Unknown',
					creators: creators,
					victors: victors
				};
			});

			res.json(formattedResults);
		});
	});

	return router;
};
