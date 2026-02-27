let playersData = [];

async function init() {
	try {
		const response = await fetch('/api/stats_viewer');
		playersData = await response.json();
		const activePlayers = playersData.filter(p => p.points > 0);

		renderPlayerList(activePlayers);
		if (activePlayers.length > 0) {
			renderPlayerCard(activePlayers[0], 1);
			const firstPlayerItem = document.querySelector('.player-item');
			if (firstPlayerItem) firstPlayerItem.classList.add('active');
		}
	} catch (err) {
		console.error('Failed to load stats: ', err);
	}
}

function renderPlayerList(players) {
	const listContainer = document.getElementById('player-list');
	listContainer.innerHTML = players.map((player, index) => {
		const flag = player.playerNationality
			? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="little-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">`
			: '';

		return `
            <div class="player-item" onclick="selectPlayer(${player.playerId}, this, ${index + 1})">
                <span>${flag} #${index + 1} - <strong>${player.playerName}</strong></span>
                <span><strong>${player.points}</strong> p.</span>
            </div>
        `;
	}).join('');
}

function selectPlayer(id, element, rank) {
	document.querySelectorAll('.player-item').forEach(el => el.classList.remove('active'));
	element.classList.add('active');

	const player = playersData.find(p => p.playerId === id);
	renderPlayerCard(player, rank);
}

function renderPlayerCard(player, rank) {
	const card = document.getElementById('player-card');

	const allFinishedLevels = [
		...player.levelsCompleted.map(l => ({ ...l, isVerified: false })),
		...player.levelsVerified.map(l => ({ ...l, isVerified: true }))
	];

	let hardestHTML = '<h3>Hardest: <em>None</em></h3>';

	if (allFinishedLevels.length > 0) {
		const hardest = allFinishedLevels.reduce((prev, curr) =>
			(prev.placement < curr.placement) ? prev : curr
		);

		hardestHTML = `<h3>Hardest: #${hardest.placement} - <strong>${hardest.name}</strong> by <strong>${hardest.publisher}</strong>${hardest.isVerified ? ' (Verified)' : ''}</h3>`;
	}

	const flag = player.playerNationality
		? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="big-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">`
		: '';
	const tagClass = (pts) => (pts === 0 ? 'level-tag legacy' : 'level-tag');

	const completedHTML = player.levelsCompleted.length > 0 ? `
        <div class="stat-section">
            <h3>Completed (${player.levelsCompleted.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCompleted.map(l => `<span class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.points} p.)">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	const verifiedHTML = player.levelsVerified.length > 0 ? `
        <div class="stat-section">
            <h3>Verified (${player.levelsVerified.length})</h3>
            <div class="level-tag-list">
                ${player.levelsVerified.map(l => `<span class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.points} p.)">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	const progressHTML = player.progressOn.length > 0 ? `
        <div class="stat-section">
            <h3>Progress On (${player.progressOn.length})</h3>
            <div class="level-tag-list">
                ${player.progressOn.map(l => `<span class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.points} p.)">${l.name} (${l.progress}%)</span>`).join('')}
            </div>
        </div>` : '';

	const createdHTML = player.levelsCreated.length > 0 ? `
        <div class="stat-section">
            <h3>Created (${player.levelsCreated.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCreated.map(l => `<span class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	card.innerHTML = `
        <h2>${flag} #${rank} - <strong>${player.playerName}</strong> - <strong>${player.points}</strong> p.</h2>
        ${hardestHTML}
        ${completedHTML}
        ${verifiedHTML}
        ${progressHTML}
        ${createdHTML}
    `;
}

init();
