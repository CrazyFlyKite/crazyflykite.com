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
					'level_id': row.level_id,
					'placement': row.placement,
					'level_name': row.level_name,
					'creators': creators,
					'publisher': row.publisher_name,
					'verifier': row.verifier_name,
					'difficulty': row.difficulty,
					'rating': row.rating,
					'has_thumbnail': row.has_thumbnail === 1,
					'showcase': row.showcase,
					'list_percentage': row.list_percentage,
					'points': row.points,
					'list_percentage_points': row.list_percentage_points,
					'victors': victors
				};
			});

			res.json(formattedResults);
		});
	});

	router.get('/api/stats_viewer', (req, res) => {
		const query = `
			SELECT
				s.*,
				(SELECT GROUP_CONCAT(CONCAT(d2.level_name, ':', r2.progress, ':', r2.is_verifier) ORDER BY d2.placement ASC SEPARATOR '|')
				FROM records r2
				JOIN demonlist d2 ON r2.level_id = d2.level_id
				WHERE r2.player_id = s.player_id AND r2.progress > 0) AS all_records,
				(SELECT GROUP_CONCAT(d3.level_name SEPARATOR '|')
				FROM creators c
				JOIN demonlist d3 ON c.level_id = d3.level_id
				WHERE c.player_id = s.player_id) AS levels_created
			FROM stats_viewer s
			ORDER BY s.points DESC, player_name DESC
		`;

		pool.query(query, (err, results) => {
			if (err) {
				console.error('SQL Error:', err.message);
				return res.status(500).json({ error: 'Database error' });
			}

			const formattedResults = results.map(row => {
				return {
					player_id: row.player_id,
					player_name: row.player_name,
					points: Number(row.points) || 0,
					records: row.all_records ? row.all_records.split('|').map(item => {
						const [name, progress, verifierBit] = item.split(':');
						return {
							'name': name,
							'%': parseInt(progress),
							'is_verifier': verifierBit === '1'
						};
					}) : [],

					created: row.levels_created ? row.levels_created.split('|') : []
				};
			});

			res.json(formattedResults);
		});
	});

	return router;
};
