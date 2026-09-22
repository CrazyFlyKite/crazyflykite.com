function redactPlayer(row) {
	if (!row) return null;

	const banned = row.is_banned === 1;
	return {
		playerId: row.player_id,
		playerName: banned ? null : row.player_name,
		isBanned: banned,
		...(row.is_creator !== undefined && { isCreator: row.is_creator === 1 }),
		...(row.percentage !== undefined && { percentage: banned ? null : row.percentage }),
		...(row.time_spent !== undefined && { timeSpent: banned ? null : row.time_spent }),
		...(row.is_mobile !== undefined && { isMobile: row.is_mobile === 1 })
	};
}

function formatRecord(r) {
	const publisherBanned = r.publisher_banned === 1;
	return {
		levelId: r.level_id,
		placement: r.placement,
		levelName: r.level_name,
		publisher: {
			playerId: publisherBanned ? null : r.publisher_id,
			playerName: publisherBanned ? null : r.publisher_name,
			isBanned: publisherBanned
		},
		percentage: r.percentage === null ? null : r.percentage,
		timeSpent: r.time_spent,
		points: r.points,
		listPercentagePoints: r.list_percentage_points
	};
}

function formatLevelsCreated(row) {
	if (!row) return null;

	return {
		levelId: row.level_id,
		placement: row.placement,
		levelName: row.level_name,
		publisher: redactPlayer({
			player_id: row.player_id,
			player_name: row.publisher,
			is_banned: row.is_banned
		})
	};
}

function groupBy(rows, key) {
	return rows.reduce((acc, row) => {
		(acc[row[key]] ??= []).push(row);
		return acc;
	}, {});
}

module.exports = { redactPlayer, formatRecord, formatLevelsCreated, groupBy };
