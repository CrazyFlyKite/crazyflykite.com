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

		document.querySelector('#search-button').addEventListener('click', updateList);
		document.querySelector('#level-search').addEventListener('keypress', (e) => {
			if (e.key === 'Enter') updateList();
		});

		updateList();
	} catch (error) {
		console.error('Error loading Demonlist:', error);
	}
}

function createLevel(placement, id, name, publisher, creators, verifier, difficulty, rating, listPercentage, hasThumbnail, showcase, points, listPercentagePoints, victors) {
	const clone = document.querySelector('#level-template').content.cloneNode(true);

	// Main
	clone.querySelector('.title').innerHTML = `#${placement + 1} - <strong>${name}</strong> by <strong>${publisher}</strong>`;
	clone.querySelector('.id').innerHTML = `ID: <strong>${id}</strong>`;
	if (creators.length > 1) clone.querySelector('.creators').innerHTML = `Created by <strong>${creators.join(', ')}</strong>`;
	clone.querySelector('.verifier').innerHTML = `Verified by <strong>${verifier}</strong>`;
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
		const sortedVictors = [...victors].sort((a, b) => b['%'] - a['%']);

		sortedVictors.forEach(v => {
			const li = document.createElement('li');
			if (v['progress'] === 100) li.innerHTML = `<strong>${v['name']}</strong>`;
			else {
				li.innerHTML = `${v['name']} (${v['progress']}%)`;
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
		const isIDSearch = !isNaN(searchTerm) && searchTerm !== "";
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
	url.searchParams.set('sort', sortOrder);
	window.history.replaceState({}, '', url);

	renderLevels(filtered);
}

function renderLevels(levelsToDisplay) {
	const listContainer = document.querySelector('.list');
	listContainer.innerHTML = '';
	const fragment = document.createDocumentFragment();

	levelsToDisplay.forEach((level) => {
		const originalPlacement = levelsData.indexOf(level);
		const levelElement = createLevel(
			originalPlacement, level['levelID'], level['levelName'], level['publisher'],
			level['creators'], level['verifier'], level['difficulty'], level['rating'],
			level['listPercentage'], level['hasThumbnail'], level['showcase'],
			level['points'], level['listPercentagePoints'], level['victors']
		);
		fragment.appendChild(levelElement);
	});

	listContainer.appendChild(fragment);
}

init();
