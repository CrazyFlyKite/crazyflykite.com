// Constants
const list = document.querySelector('.list');

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
function createLevel(placement, id, name, publisher, creators, verifier, difficulty, rating, listPercentage, victors) {
	const clone = document.querySelector('#level-template').content.cloneNode(true);

	clone.querySelector('.title').innerHTML = `#${placement + 1} - <strong>${name}</strong> by <strong>${publisher}</strong>`;
	clone.querySelector('.id').innerHTML = `ID: <strong>${id}</strong>`;
	if (creators.length > 1) clone.querySelector('.creators').innerHTML = `Created by <strong>${creators.join(', ')}</strong>`;
	clone.querySelector('.verifier').innerHTML = `Verified by <strong>${verifier}</strong>`;
	clone.querySelector('.list-percentage').innerHTML = `List %: <strong>${listPercentage}%</strong>`;
	clone.querySelector('.difficulty').src = `/images/difficulties/${difficulties[difficulty]}/${ratings[rating]}.png`;

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

	list.appendChild(clone);
}

// Add levels
fetch('/data/demonlist')
	.then(response => response.json())
	.then(data => {
		for (let index = 0; index < data.length; index++) {
			let level = data[index];
			createLevel(index, level['id'], level['name'], level['publisher'], level['creators'], level['verifier'], level['difficulty'], level['rating'], level['list_percentage'], level['victors']);
		}
	})
	.catch(error => {
		console.error(error);
	});
