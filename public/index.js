// Age
function calculateAge(birthDate) {
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

	return age;
}

const birthDate = new Date(2010, 5, 9);
document.querySelector('#age').textContent = String(calculateAge(birthDate));
