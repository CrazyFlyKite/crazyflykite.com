const { getLevels, getCreatorsForLevels, getRecordsForLevels } = require('../database/levels');
const { redactPlayer, groupBy } = require('../utils/format');

async function getFormattedLevels(pool, listId) {
	const levelRows = await getLevels(pool, listId);
	const levelIds = levelRows.map(l => l.level_id);

	const [creatorRows, recordRows] = await Promise.all([
		getCreatorsForLevels(pool, levelIds),
		getRecordsForLevels(pool, levelIds)
	]);

	return levelRows.map(l => {
		const levelCreators = groupBy(creatorRows, 'level_id')[l.level_id] || [];
		const levelRecords = groupBy(recordRows, 'level_id')[l.level_id] || [];

		return {
			levelId: l.level_id,
			placement: l.placement,
			levelName: l.level_name,
			creators: levelCreators.filter(c => c.is_creator).map(redactPlayer),
			publisher: redactPlayer(levelCreators.find(c => c.is_publisher)),
			verifier: redactPlayer(levelRecords.find(r => r.is_verifier)),
			victors: levelRecords.filter(r => !r.is_verifier).map(redactPlayer),
			difficulty: l.difficulty,
			rating: l.rating,
			is2p: l.is_2p === 1,
			hasThumbnail: l.has_thumbnail === 1,
			showcase: l.showcase,
			listPercentage: l.list_percentage,
			points: l.points,
			listPercentagePoints: l.list_percentage_points,
			listType: l.list_type
		};
	});
}

module.exports = { getFormattedLevels };
