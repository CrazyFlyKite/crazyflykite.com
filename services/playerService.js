const { getPlayers, getRecordsForPlayers, getCreatedLevelsForPlayers } = require('../database/players');
const { formatRecord, formatLevelsCreated, groupBy } = require('../utils/format');

async function getFormattedPlayers(pool, listId) {
	const playerRows = await getPlayers(pool, listId);
	const playerIds = playerRows.map(p => p.player_id);

	const [recordRows, createdRows] = await Promise.all([
		getRecordsForPlayers(pool, playerIds, listId),
		getCreatedLevelsForPlayers(pool, playerIds, listId)
	]);

	return playerRows.map(p => {
		const banned = p.is_banned === 1;
		const allRecords = banned ? [] : (groupBy(recordRows, 'player_id')[p.player_id] || []);
		const created = banned ? [] : (groupBy(createdRows, 'player_id')[p.player_id] || []);

		return {
			playerId: p.player_id,
			playerName: banned ? null : p.player_name,
			playerNationality: banned ? null : p.player_nationality,
			isBanned: banned,
			points: banned ? 0 : (p.points || 0),
			device: banned ? null : p.device,
			mainList: banned ? 0 : (parseInt(p.main_list) || 0),
			extendedList: banned ? 0 : (parseInt(p.extended_list) || 0),
			legacyList: banned ? 0 : (parseInt(p.legacy_list) || 0),
			levelsVerified: allRecords.filter(r => r.is_verifier).map(formatRecord),
			levelsCompleted: allRecords.filter(r => !r.is_verifier && (r.percentage === 100 || r.percentage === null)).map(formatRecord),
			progressOn: allRecords.filter(r => !r.is_verifier && r.percentage !== null && r.percentage < 100).map(formatRecord),
			levelsCreated: created.map(formatLevelsCreated)
		};
	});
}

module.exports = { getFormattedPlayers };
