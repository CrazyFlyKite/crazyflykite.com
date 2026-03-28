// Constants
let levelsData = [];
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
}
const statsViewerLink = '/seagdps/stats_viewer/?player='

// Variables
let createdMainListTitle = false;
let createdExtendedListTitle = false;
let createdLegacyListTitle = false;

// Functions
async function init() {
	try {
		const response = await fetch('/api/demonlist');
		levelsData = await response.json();

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

		updateList();
	} catch (error) {
		console.error('Error loading Demonlist:', error);
	}
}

function createLevel(placement, id, name, publisher, creators, verifier, difficulty, rating, listPercentage, hasThumbnail, showcase, points, listPercentagePoints, listType, victors) {
	const clone = document.querySelector('#level-template').content.cloneNode(true);

	// List Type


	// Main
	clone.querySelector('.title').innerHTML = `#${placement + 1} - <strong>${name}</strong> by <strong><a href="${statsViewerLink}${publisher.playerID}" class="player-link">${publisher.name}</a></strong>`;
	clone.querySelector('.id').innerHTML = `ID: <strong>${id}</strong>`;
	if (creators.length > 1) clone.querySelector('.creators').innerHTML = `Created by ${creators.map(c => `<a href="${statsViewerLink}${c.playerID}" class="player-link"><strong>${c.name}</strong></a>`).join(', ')}`;
	clone.querySelector('.verifier').innerHTML = `Verified by <strong><a href="${statsViewerLink}${verifier.playerID}" class="player-link">${verifier.name}</a></strong>`;
	if (points === 0) clone.querySelector('.points').innerHTML = `List %: <strong>${listPercentage}%</strong>`;
	else clone.querySelector('.points').innerHTML = `Points: <strong>${points} p.</strong> (<strong>100%</strong>) / <strong>${listPercentagePoints} p.</strong> (<strong>${listPercentage}%</strong>)`;
	clone.querySelector('.difficulty').src = `/images/difficulties/${difficulties[difficulty]}/${ratings[rating]}.png`;

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
	if (victors.length > 0) {
		victors.forEach(v => {
			const li = document.createElement('li');
			if (v.progress === 100) li.innerHTML = `<strong><a href="${statsViewerLink}${v.playerID}" class="player-link">${v.name}</a></strong>`;
			else {
				li.innerHTML = `<a href="${statsViewerLink}${v.playerID}" class="player-link">${v.name}</a> (${v.progress}%)`;
				li.classList.add('non-victor');
			}
			victorsList.appendChild(li);
		});
	} else clone.querySelector('.victors-text').innerHTML = 'Victors: <em>None</em>';

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
		const nameMatch = level.levelName.toLowerCase().includes(searchTerm);
		const isIDSearch = !isNaN(searchTerm) && searchTerm !== '';
		const idMatch = isIDSearch ? level.levelID.toString() === searchTerm : level.levelID.toString().includes(searchTerm);

		return nameMatch || idMatch;
	});

	filtered.sort((a, b) => {
		const placementA = levelsData.indexOf(a);
		const placementB = levelsData.indexOf(b);
		return sortOrder === 'asc' ? placementA - placementB : placementB - placementA;
	});

	const url = new URL(window.location);
	searchTerm ? url.searchParams.set('search', searchTerm) : url.searchParams.delete('search');
	if (sortOrder === 'desc') url.searchParams.set('sort', 'desc');
	else url.searchParams.delete('sort');
	window.history.replaceState({}, '', url);

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
		const levelElement = createLevel(
			originalPlacement, level.levelID, level.levelName, level.publisher,
			level.creators, level.verifier, level.difficulty, level.rating,
			level.listPercentage, level.hasThumbnail, level.showcase,
			level.points, level.listPercentagePoints, level.listType, level.victors
		);
		fragment.appendChild(levelElement);
	});

	listContainer.appendChild(fragment);
}

init();
