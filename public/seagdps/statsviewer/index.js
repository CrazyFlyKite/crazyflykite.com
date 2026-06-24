// Variables
let playersData = [];
let globalTotals = {
	main: 0,
	extended: 0,
	legacy: 0
};
let listMap = {};
let currentListName;

// Functions
async function loadData(listId) {
	const totalsResponse = await fetch(`/api/lists/${listId}/totals`);
	const totalsData = await totalsResponse.json();

	globalTotals = {
		main: totalsData.main || 0,
		extended: totalsData.extended || 0,
		legacy: totalsData.legacy || 0
	};

	const response = await fetch(`/api/lists/${listId}/players`);
	playersData = await response.json();

	renderPlayerList(playersData.filter(p => !p.isBanned));
}

async function init() {
	try {
		// URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const playerId = parseInt(urlParams.get('player'));

		const listResponse = await fetch(`/api/lists`);
		const listData = await listResponse.json();
		listMap = Object.fromEntries(listData.map(l => [l.listName, l.listId]));

		const listName = urlParams.get('list') || 'demonlist';
		currentListName = listName;
		const listId = listMap[listName];

		const url = new URL(window.location);
		url.searchParams.set('list', listName);
		window.history.replaceState({}, '', url.toString());

		const listSelector = document.querySelector('#list-selector');
		listSelector.innerHTML = listData.map(l => `<option value="${l.listName}">${l.displayName}</option>`).join('');
		listSelector.value = listName;
		listSelector.addEventListener('change', () => {
			const listName = listSelector.value;
			currentListName = listName;
			const url = new URL(window.location);
			url.searchParams.set('list', listName);
			url.searchParams.delete('player');
			window.history.pushState({}, '', url.toString());
			window.location.href = url.toString();
		});

		// Adapt the page
		document.documentElement.style.setProperty(
			'--active-list-color',
			getComputedStyle(document.documentElement)
				.getPropertyValue(`--${listName}-color`)
				.trim()
		);
		document.querySelector('#api-button').href = `/api/lists/${listId}/players`;

		// Load players
		await loadData(listId);

		if (playerId) {
			const targetPlayer = playersData.find(p => p.playerId === playerId);

			if (targetPlayer) {
				const rank = playersData.indexOf(targetPlayer) + 1;
				selectPlayer(targetPlayer.playerId, null, rank);
			} else {
				const cleanUrl = new URL(window.location);
				cleanUrl.search = '';
				window.history.replaceState({path: cleanUrl.href}, '', cleanUrl.href);
			}
		}
	} catch (error) {
		console.warn('Error loading players:', error);
	}
}

function renderPlayerList(players) {
	const listContainer = document.querySelector('#player-list');
	listContainer.innerHTML = players.map((player, index) => {
		if (player.levelsVerified.length > 0 || player.levelsCompleted.length > 0 || player.progressOn.length > 0) {
			const flag = player.playerNationality ? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="little-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">` : '';

			return `
				<div class="player-item" id="player-item-${player.playerId}" onclick="selectPlayer(${player.playerId}, this, ${index + 1})">
					<span>${flag} #${index + 1} - <strong>${player.playerName}</strong></span>
					<span><strong>${player.points}</strong> p.</span>
				</div>
			`;
		}
	}).join('');
}

function selectPlayer(id, element, rank) {
	document.querySelectorAll('.player-item').forEach(el => el.classList.remove('active'));

	const activeEl = element || document.querySelector(`#player-item-${id}`);
	if (activeEl) activeEl.classList.add('active');

	const player = playersData.find(p => p.playerId === id);
	if (player) {
		renderPlayerCard(player, rank);

		const newUrl = new URL(window.location);
		newUrl.searchParams.set('player', id);
		window.history.pushState({path: newUrl.href}, '', newUrl.href);
	}
}

function renderPlayerCard(player, rank) {
	const card = document.querySelector('#player-card');

	if (player.isBanned) {
		card.innerHTML = '<p style="text-align: center; opacity: 0.5;">This player is banned</p>';
		return;
	} else if (!player) {
		card.innerHTML = '<p style="text-align: center; opacity: 0.5;">This player is banned</p>';
		return;
	}

	document.title = `SeaGDPS Stats Viewer | ${player.playerName}`;

	const allFinishedLevels = [...player.levelsCompleted.map(l => ({...l, isVerified: false})), ...player.levelsVerified.map(l => ({...l, isVerified: true}))];

	let hardestHTML = '<h3>Hardest: <em>None</em></h3>';

	if (allFinishedLevels.length > 0) {
		const hardest = allFinishedLevels.reduce((prev, curr) => (prev.placement < curr.placement) ? prev : curr);

		hardestHTML = `<h3>Hardest: #${hardest.placement} - <strong><a href="/seagdps/${currentListName}/?search=${hardest.levelId}">${hardest.levelName}</a></strong> by <strong>${hardest.publisher}</strong>${hardest.isVerified ? ' (Verified)' : ''}</h3>`;
	}


	console.log(globalTotals.main);

	// Different list types
	const parts = []

	if (globalTotals.main > 0)
		parts.push(`<strong>${player.mainList}</strong>/${globalTotals.main} Main`);

	if (globalTotals.extended > 0)
		parts.push(`<strong>${player.extendedList}</strong>/${globalTotals.extended} Extended`);

	if (globalTotals.legacy > 0)
		parts.push(`<strong>${player.legacyList}</strong>/${globalTotals.legacy} Legacy`);

	let listStatsHTML = `<h3>${parts.join(', ')}</h3>`;

	// Flags
	const flag = player.playerNationality ? `<img src="https://hatscripts.github.io/circle-flags/flags/${player.playerNationality.toLowerCase()}.svg" class="big-flag" title="${player.playerNationality.toUpperCase()}" alt="Player nationality">` : '';
	const tagClass = (pts) => (pts === 0 ? 'level-tag legacy' : 'level-tag');

	// Levels
	const completedHTML = player.levelsCompleted.length > 0 ? `
        <div class="stat-section">
            <h3>Completed (${player.levelsCompleted.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCompleted.map(l => `<a href="/seagdps/${currentListName}/?search=${l.levelId}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.levelName} by ${l.publisher} (${l.points} p.)">${l.levelName}</a>`).join('')}
            </div>
        </div>` : '';

	const verifiedHTML = player.levelsVerified.length > 0 ? `
        <div class="stat-section">
            <h3>Verified (${player.levelsVerified.length})</h3>
            <div class="level-tag-list">
                ${player.levelsVerified.map(l => `<a href="/seagdps/${currentListName}/?search=${l.levelId}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.levelName} by ${l.publisher} (${l.points} p.)">${l.levelName}</a>`).join('')}
            </div>
        </div>` : '';

	const progressOnHTML = player.progressOn.length > 0 ? `
        <div class="stat-section">
            <h3>Progress On (${player.progressOn.length})</h3>
            <div class="level-tag-list">
                ${player.progressOn.map(l => `<a href="/seagdps/${currentListName}/?search=${l.levelId}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.levelName} by ${l.publisher} (${l.listPercentagePoints} p.)">${l.levelName} (${l.percentage}%)</a>`).join('')}
            </div>
        </div>` : '';

	const createdHTML = player.levelsCreated.length > 0 ? `
        <div class="stat-section">
            <h3>Created (${player.levelsCreated.length})</h3>
            <div class="level-tag-list">
                ${player.levelsCreated.map(l => `<a href="/seagdps/${currentListName}/?search=${l.levelId}" class="${tagClass(l.points)}" title="#${l.placement} - ${l.levelName} by ${l.publisher}">${l.levelName}</a>`).join('')}
            </div>
        </div>` : '';

	card.innerHTML = `
        <h2>${flag} #${rank} - <strong>${player.playerName}</strong> - <strong>${player.points}</strong> p.</h2>
        
        ${hardestHTML}
        ${listStatsHTML}
        ${completedHTML}
        ${verifiedHTML}
        ${progressOnHTML}
        ${createdHTML}
    `;
}

init();
