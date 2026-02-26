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
			? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="little-flag" alt="Player nationality">`
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
	const flag = player.playerNationality
		? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="big-flag" title=${player.playerNationality.toUpperCase()} alt="Player nationality">`
		: '';

	const completedHTML = player.levelsCompleted.length > 0 ? `
        <div class="stat-section">
            <h3>Completed (${player.levelsCompleted.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCompleted.map(l => `<span class="level-tag" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	const verifiedHTML = player.levelsVerified.length > 0 ? `
        <div class="stat-section">
            <h3>Verified (${player.levelsVerified.length})</h3>
            <div class="level-tag-list">
                ${player.levelsVerified.map(l => `<span class="level-tag" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	const progressHTML = player.progressOn.length > 0 ? `
        <div class="stat-section">
            <h3>Progress On (${player.progressOn.length})</h3>
            <div class="level-tag-list">
                ${player.progressOn.map(l => `<span class="level-tag" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name} (${l.progress}%)</span>`).join('')}
            </div>
        </div>` : '';

	const createdHTML = player.levelsCreated.length > 0 ? `
        <div class="stat-section">
            <h3>Created (${player.levelsCreated.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCreated.map(l => `<span class="level-tag" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name}</span>`).join('')}
            </div>
        </div>` : '';

	card.innerHTML = `
        <h2>${flag} #${rank} - <strong>${player.playerName}</strong> - <strong>${player.points}</strong> p.</h2>
        ${completedHTML}
        ${verifiedHTML}
        ${progressHTML}
        ${createdHTML}
    `;
}

init();
