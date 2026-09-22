async function getPlayers(pool, listId) {
	const [rows] = await pool.promise().query(`
		SELECT * FROM stats WHERE list_id = ?
		ORDER BY points DESC, player_name
	`, [listId]);

	return rows;
}

async function getRecordsForPlayers(pool, playerIds, listId) {
	if (playerIds.length === 0) return [];

	const [rows] = await pool.promise().query(`
		SELECT
			r.player_id,
			l.level_id,
			l.placement,
			l.level_name,
			p_pub.player_id AS publisher_id,
			p_pub.player_name AS publisher_name,
			p_pub.is_banned AS publisher_banned,
			r.percentage,
			r.time_spent,
			r.is_verifier,
			lp.points,
			lp.list_percentage_points
		FROM records r
		JOIN levels l ON r.level_id = l.level_id
		LEFT JOIN level_points lp ON l.level_id = lp.level_id
		LEFT JOIN creators c_pub ON l.level_id = c_pub.level_id AND c_pub.is_publisher = 1
		LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
		WHERE r.player_id IN (?) AND l.list_id = ?
		ORDER BY l.placement
	`, [playerIds, listId]);

	return rows;
}

async function getCreatedLevelsForPlayers(pool, playerIds, listId) {
	if (playerIds.length === 0) return [];

	const [rows] = await pool.promise().query(`
		SELECT c.player_id, l.level_id, l.placement, l.level_name, p_pub.player_name AS publisher
		FROM creators c
		JOIN levels l ON c.level_id = l.level_id
		LEFT JOIN creators c_pub ON l.level_id = c_pub.level_id AND c_pub.is_publisher = 1
		LEFT JOIN players p_pub ON c_pub.player_id = p_pub.player_id
		WHERE c.player_id IN (?) AND c.is_creator IS TRUE AND l.list_id = ?
		ORDER BY l.placement
	`, [playerIds, listId]);

	return rows;
}

module.exports = { getPlayers, getRecordsForPlayers, getCreatedLevelsForPlayers };
