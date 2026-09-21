async function init() {
	const listResponse = await fetch('/api/lists');
	const listRawData = await listResponse.json();

	const sorted = [...listRawData].sort((a, b) => a.buttonRow - b.buttonRow || a.buttonColumn - b.buttonColumn);

	const rows = new Map();
	for (const list of sorted) {
		if (!rows.has(list.buttonRow)) rows.set(list.buttonRow, []);
		rows.get(list.buttonRow).push(list);
	}

	const main = document.querySelector('main');
	const fragment = document.createDocumentFragment();

	for (const rowLists of rows.values()) {
		const row = document.createElement('div');
		row.className = 'horizontal-line';

		for (const list of rowLists) {
			const a = document.createElement('a');
			a.href = `/seagdps/${list.listName}`;
			a.className = 'link';
			a.id = list.listName;
			a.setAttribute('aria-label', list.displayName);
			a.textContent = list.displayName;
			a.style.background = `linear-gradient(135deg, #${list.primaryColor}BF, #${list.secondaryColor}BF)`;
			row.appendChild(a);
		}

		fragment.appendChild(row);
	}

	main.prepend(fragment);
}

init();
