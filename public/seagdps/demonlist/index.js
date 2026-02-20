// Constants
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
function createLevel(placement, id, name, publisher, creators, verifier, difficulty, rating, listPercentage, hasThumbnail, showcase, points, list_percentage_points, victors) {
	const clone = document.querySelector('#level-template').content.cloneNode(true);

	// Main
	clone.querySelector('.title').innerHTML = `#${placement + 1} - <strong>${name}</strong> by <strong>${publisher}</strong>`;
	clone.querySelector('.id').innerHTML = `ID: <strong>${id}</strong>`;
	if (creators.length > 1) clone.querySelector('.creators').innerHTML = `Created by <strong>${creators.join(', ')}</strong>`;
	clone.querySelector('.verifier').innerHTML = `Verified by <strong>${verifier}</strong>`;
	clone.querySelector('.list-percentage').innerHTML = `List %: <strong>${listPercentage}%</strong>`;
	clone.querySelector('.points').innerHTML = listPercentage === 100 ? `Points: <strong>${points}</strong>` : `Points: <strong>${points}</strong> / <strong>${list_percentage_points}</strong>`;
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
			if (v['%'] === 100) li.innerHTML = `<strong>${v['name']}</strong>`;
			else {
				li.innerHTML = `${v['name']} (${v['%']}%)`;
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

// Add levels
fetch('/api/demonlist')
	.then(response => response.json())
	.then(data => {
		const fragment = document.createDocumentFragment();

		for (let index = 0; index < data.length; index++) {
			let level = data[index];
			const levelElement = createLevel(
				index, level['level_id'], level['level_name'], level['publisher_name'], level['creators'], level['verifier'],
				level['difficulty'], level['rating'], level['list_percentage'], level['has_thumbnail'],
				level['showcase'], level['points'], level['list_percentage_points'], level['victors']
			);
			fragment.appendChild(levelElement);
		}

		document.querySelector('.list').appendChild(fragment);
	})
	.catch(error => {
		console.error(error);
	});
