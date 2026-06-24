// Constants
let levelsData;
let listData;
let listMap;
const difficulties = {
	1: 'easydemon',
	2: 'mediumdemon',
	3: 'harddemon',
	4: 'insanedemon',
	5: 'extremedemon'
};
const ratings = {
	1: 'rate',
	2: 'featured',
	3: 'epic',
	4: 'legendary',
	5: 'mythic'
};
const listTypes = {
	1: 'Main List',
	2: 'Extended List',
	3: 'Legacy List'
};

// Functions
async function init() {
	try {
		const listResponse = await fetch(`/api/lists`)
		const listDataData = await listResponse.json()

		listMap = Object.fromEntries(listDataData.map(l => [l.listName, l.listId]))

		const pathParts = window.location.pathname.split('/').filter(Boolean);
		const slug = pathParts[pathParts.length - 1];

		const listId = listMap[slug] || listMap.demonlist;

		listData = listDataData.find(l => l.listId === listId);

		const levelResponse = await fetch(`/api/lists/${listId}/levels`);
		levelsData = await levelResponse.json();

		const urlParams = new URLSearchParams(window.location.search);
		const searchParam = urlParams.get('search');
		const sortParam = urlParams.get('sort');

		if (searchParam) document.querySelector('#level-search').value = searchParam;
		if (sortParam) document.querySelector('#level-sort').value = sortParam;

		const searchInput = document.querySelector('#level-search');
		const sortSelect = document.querySelector('#level-sort');
		const searchButton = document.querySelector('#search-button');
		const clearButton = document.querySelector('#clear-button');

		searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') updateList();
		});
		searchButton.addEventListener('click', updateList);
		clearButton.addEventListener('click', () => {
			searchInput.value = '';
			sortSelect.value = 'asc';
			updateList();
		});

		// Adapt the list
		document.title = `SeaGDPS ${listData.displayName}`;
		document.querySelector('h1').innerText = `${listData.displayName}`;
		document.documentElement.style.setProperty('--active-list-color', getComputedStyle(document.documentElement)
			.getPropertyValue(`--${listData.listName}-color`)
			.trim()
		);
		document.querySelector('#api-button').href = `/api/lists/${listData.listId}/levels`;

		updateList();
	} catch (error) {
		console.error('Error loading Demonlist:', error);
	}
}

function createLevel(placement, id, name, publisher, creators, verifier, difficulty, rating, listPercentage, hasThumbnail, showcase, points, listPercentagePoints, listType, victors) {
	const clone = document.querySelector('#level-template').content.cloneNode(true);

	// Main
	clone.querySelector('.title').innerHTML = `#${placement + 1} - <strong>${name}</strong> by <strong><a href="/seagdps/statsviewer/?list=${listData.listName}&player=${publisher.playerId}" class="player-link">${publisher.playerName}</a></strong>`;
	clone.querySelector('.id').innerHTML = `ID: <strong>${id}</strong>`;
	if (creators.length > 1) clone.querySelector('.creators').innerHTML = `Created by ${creators.map(c => `<a href="/seagdps/statsviewer/?list=${listData.listName}&player=${c.playerId}" class="player-link"><strong>${c.playerName}</strong></a>`).join(', ')}`;
	clone.querySelector('.verifier').innerHTML = `Verified by <strong><a href="/seagdps/statsviewer/?list=${listData.listName}&player=${verifier.playerId}" class="player-link">${verifier.playerName}</a></strong>` + (verifier.timeSpent ? ` (<strong>${verifier.timeSpent}</strong>)` : '');
	if (points === 0) clone.querySelector('.points').innerHTML = `List %: <strong>${listPercentage}%</strong>`;
	if (listPercentage !== null) clone.querySelector('.points').innerHTML = `Points: <strong>${points} p.</strong> (<strong>100%</strong>) / <strong>${listPercentagePoints} p.</strong> (<strong>${listPercentage}%</strong>)`;
	else clone.querySelector('.points').innerHTML = `Points: <strong>${points} p.</strong>`;

	// Difficulty face
	const difficultyImage = clone.querySelector('.difficulty')
	if (difficulty === null || rating === null) difficultyImage.style.display = 'none'
	else {
		difficultyImage.style.display = ''
		difficultyImage.src = `/images/difficulties/${difficulties[difficulty]}/${ratings[rating]}.png`
	}

	// Copyable ID
	const idElement = clone.querySelector('.id');
	idElement.innerHTML = `ID: <strong>${id}</strong>`;
	idElement.style.cursor = 'pointer';

	idElement.onclick = () => {
		navigator.clipboard.writeText(id).then(() => {
			const originalText = idElement.innerHTML;
			idElement.innerHTML = 'Copied!';
			idElement.style.color = '#00FF00';

			setTimeout(() => {
				idElement.innerHTML = originalText;
				idElement.style.color = '';
			}, 800);
		}).catch(error => {
			console.error('Failed to copy: ', error);
		});
	};

	// Difficulty
	clone.querySelector('.difficulty').setAttribute('rating', rating);

	// Victors
	const victorsList = clone.querySelector('.victors-list');
	if (!victors || victors.length === 0) clone.querySelector('.victors-text').innerHTML = 'Victors: <em>None</em>'; else {
		victors.forEach(v => {
			const li = document.createElement('li');

			if (v.percentage !== null) {
				if (v.percentage === 100) li.innerHTML = `<strong><a href="/seagdps/statsviewer/?list=${listData.listName}&player=${v.playerId}" class="player-link">${v.playerName}</a></strong>`;
				else {
					li.innerHTML = `<a href="/seagdps/statsviewer/?list=${listData.listName}&player=${v.playerId}" class="player-link">${v.playerName}</a> (${v.percentage}%)`;
					li.classList.add('non-victor');
				}
			} else {
				if (v.timeSpent !== null) li.innerHTML = `<strong><a href="/seagdps/statsviewer/?list=${listData.listName}&player=${v.playerId}" class="player-link">${v.playerName}</a></strong> (<strong>${v.timeSpent}</strong>)`;
				else li.innerHTML = `<strong><a href="/seagdps/statsviewer/?list=${listData.listName}&player=${v.playerId}" class="player-link">${v.playerName}</a></strong>`;
			}
			victorsList.appendChild(li);
		});
	}

	// Thumbnail
	clone.querySelector('.level-thumbnail').src = hasThumbnail ? `/images/thumbnails/${id}.jpg` : '/images/thumbnails/default.png';

	// Showcase
	const wrapper = clone.querySelector('.thumbnail-wrapper');
	const playBtn = clone.querySelector('.play-button');

	if (showcase) {
		playBtn.style.display = 'flex';
		wrapper.style.cursor = 'pointer';
		wrapper.onclick = () => window.open(showcase, '_blank');
	} else playBtn.style.display = 'none';

	// Add
	return clone;
}

function updateList() {
	const searchTerm = document.querySelector('#level-search').value.toLowerCase().trim();
	const sortOrder = document.querySelector('#level-sort').value;

	let filtered = levelsData.filter(level => {
		const nameMatch = level.levelName.toLowerCase().startsWith(searchTerm);
		const isIdSearch = searchTerm !== '' && !Number.isNaN(Number(searchTerm))
		const idMatch = isIdSearch ? level.levelId.toString() === searchTerm : level.levelId.toString().includes(searchTerm);

		return nameMatch || idMatch;
	});

	filtered.sort((a, b) => {
		const placementA = levelsData.indexOf(a);
		const placementB = levelsData.indexOf(b);
		return sortOrder === 'asc' ? placementA - placementB : placementB - placementA;
	});

	const url = new URL(window.location);
	searchTerm ? url.searchParams.set('search', searchTerm) : url.searchParams.delete('search');
	if (sortOrder === 'desc') url.searchParams.set('sort', 'desc'); else url.searchParams.delete('sort');
	window.history.replaceState({}, '', url.toString());

	renderLevels(filtered);
}

function renderLevels(levelsToDisplay) {
	const listContainer = document.querySelector('.list');
	listContainer.innerHTML = '';
	const fragment = document.createDocumentFragment();

	if (levelsToDisplay.length === 0) {
		listContainer.innerHTML = `<div class="no-results">No Levels Found :(</div>`;
		return;
	}

	let lastType = null;

	levelsToDisplay.forEach((level) => {
		if (level.listType !== lastType) {
			const header = document.createElement('h3');
			header.className = 'list-section-title';
			header.innerText = listTypes[level.listType];
			fragment.appendChild(header);
			lastType = level.listType;
		}

		const originalPlacement = levelsData.indexOf(level);
		const levelElement = createLevel(originalPlacement, level.levelId, level.levelName, level.publisher, level.creators, level.verifier, level.difficulty, level.rating, level.listPercentage, level.hasThumbnail, level.showcase, level.points, level.listPercentagePoints, level.listType, level.victors);
		fragment.appendChild(levelElement);
	});

	listContainer.appendChild(fragment);
}

init();
