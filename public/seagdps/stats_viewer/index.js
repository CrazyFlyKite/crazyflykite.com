// Variables
let playersData = [];
let globalTotals = { main: 0, extended: 0, legacy: 0 };

async function init() {
	const urlParams = new URLSearchParams(window.location.search);
	const playerID = parseInt(urlParams.get('player'));

	try {
		const totalsResponse = await fetch('/api/totals');
		const totalsData = await totalsResponse.json();
		globalTotals = {
			main: totalsData.main || 0,
			extended: totalsData.extended || 0,
			legacy: totalsData.legacy || 0
		};

		const response = await fetch('/api/stats_viewer');
		playersData = await response.json();
		renderPlayerList(playersData);

		if (playerID) {
			const targetPlayer = playersData.find(p => p.playerID === playerID);

			if (targetPlayer) {
				const rank = playersData.indexOf(targetPlayer) + 1;
				selectPlayer(targetPlayer.playerID, null, rank);
			} else console.error('Player ID from URL not found in database:', playerID);
		}
	} catch (error) {
		console.warn('Error loading players:', error);
	}
}

function renderPlayerList(players) {
	const listContainer = document.getElementById('player-list');
	listContainer.innerHTML = players.map((player, index) => {
		if (player.levelsVerified.length > 0 || player.levelsCompleted.length > 0 || player.levelsCompleted.progressOn > 0) {
			const flag = player.playerNationality
				? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="little-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">`
				: '';

			return `
				<div class="player-item" onclick="selectPlayer(${player.playerID}, this, ${index + 1})">
					<span>${flag} #${index + 1} - <strong>${player.playerName}</strong></span>
					<span><strong>${player.points}</strong> p.</span>
				</div>
			`;
		}
	}).join('');
}

function selectPlayer(id, element, rank) {
	document.querySelectorAll('.player-item').forEach(el => el.classList.remove('active'));

	const activeEl = element || document.getElementById(`player-item-${id}`);
	if (activeEl) activeEl.classList.add('active');

	const player = playersData.find(p => p.playerID === id);
	if (player) {
		renderPlayerCard(player, rank);

		const newUrl = new URL(window.location);
		newUrl.searchParams.set('player', id);
		window.history.pushState({path: newUrl.href}, '', newUrl.href);
	}
}

function renderPlayerCard(player, rank) {
	const card = document.getElementById('player-card');
	document.title = `SeaGDPS Stats Viewer | ${player.playerName}`;

	const allFinishedLevels = [
		...player.levelsCompleted.map(l => ({...l, isVerified: false})),
		...player.levelsVerified.map(l => ({...l, isVerified: true}))
	];

	let hardestHTML = '<h3>Hardest: <em>None</em></h3>';

	if (allFinishedLevels.length > 0) {
		const hardest = allFinishedLevels.reduce((prev, curr) =>
			(prev.placement < curr.placement) ? prev : curr
		);

		hardestHTML = `<h3>Hardest: #${hardest.placement} - <strong><a href="/seagdps/demonlist/?search=${hardest.levelID}">${hardest.name}</a></strong> by <strong>${hardest.publisher}</strong>${hardest.isVerified ? ' (Verified)' : ''}</h3>`;
	}

	console.log(globalTotals.main);
	let listStatsHTML = `<h3><strong>${player.mainList}</strong>/${globalTotals.main} Main, <strong>${player.extendedList}</strong>/${globalTotals.extended} Extended, <strong>${player.legacyList}</strong>/${globalTotals.legacy} Legacy</h3>`

	const flag = player.playerNationality
		? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="big-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">`
		: '';
	const tagClass = (pts) => (pts === 0 ? 'level-tag legacy' : 'level-tag');

	const completedHTML = player.levelsCompleted.length > 0 ? `
        <div class="stat-section">
            <h3>Completed (${player.levelsCompleted.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCompleted.map(l => `<a href="/seagdps/demonlist/?search=${l.levelID}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.points} p.)">${l.name}</a>`).join('')}
            </div>
        </div>` : '';

	const verifiedHTML = player.levelsVerified.length > 0 ? `
        <div class="stat-section">
            <h3>Verified (${player.levelsVerified.length})</h3>
            <div class="level-tag-list">
                ${player.levelsVerified.map(l => `<a href="/seagdps/demonlist/?search=${l.levelID}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.points} p.)">${l.name}</a>`).join('')}
            </div>
        </div>` : '';

	const progressHTML = player.progressOn.length > 0 ? `
        <div class="stat-section">
            <h3>Progress On (${player.progressOn.length})</h3>
            <div class="level-tag-list">
                ${player.progressOn.map(l => `<a href="/seagdps/demonlist/?search=${l.levelID}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher} (${l.listPercentagePoints} p.)">${l.name} (${l.progress}%)</a>`).join('')}
            </div>
        </div>` : '';

	const createdHTML = player.levelsCreated.length > 0 ? `
        <div class="stat-section">
            <h3>Created (${player.levelsCreated.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCreated.map(l => `<a href="/seagdps/demonlist/?search=${l.levelID}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.name} by ${l.publisher}">${l.name}</a>`).join('')}
            </div>
        </div>` : '';

	card.innerHTML = `
        <h2>${flag} #${rank} - <strong>${player.playerName}</strong> - <strong>${player.points}</strong> p.</h2>
        
        ${hardestHTML}
        ${listStatsHTML}
        ${completedHTML}
        ${verifiedHTML}
        ${progressHTML}
        ${createdHTML}
    `;
}

init();
