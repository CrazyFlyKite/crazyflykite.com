async function getLevels(pool, listId) {
	const [rows] = await pool.promise().query(`
		SELECT l.*, lp.points, lp.list_percentage_points
		FROM levels l
		LEFT JOIN level_points lp ON l.level_id = lp.level_id
		WHERE l.list_id = ?
		ORDER BY l.placement
	`, [listId]);

	return rows;
}

async function getCreatorsForLevels(pool, levelIds) {
	if (levelIds.length === 0) return [];

	const [rows] = await pool.promise().query(`
		SELECT c.level_id, p.player_id, p.player_name, p.is_banned, c.is_creator, c.is_publisher
		FROM creators c
		JOIN players p ON c.player_id = p.player_id
		WHERE c.level_id IN (?)
	`, [levelIds]);

	return rows;
}

async function getRecordsForLevels(pool, levelIds) {
	if (levelIds.length === 0) return [];

	const [rows] = await pool.promise().query(`
		SELECT r.level_id, p.player_id, p.player_name, p.is_banned, r.percentage, r.time_spent, r.is_verifier, r.is_mobile
		FROM records r
		JOIN players p ON r.player_id = p.player_id
		WHERE r.level_id IN (?) AND (p.is_banned IS FALSE OR r.is_verifier = TRUE)
		ORDER BY r.percentage DESC, r.time_spent DESC, player_name
	`, [levelIds]);

	return rows;
}

module.exports = { getLevels, getCreatorsForLevels, getRecordsForLevels };
