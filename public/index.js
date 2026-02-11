// Scroll
const observer = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) entry.target.classList.add('show');
		else entry.target.classList.remove('show');
	})
});

const hiddenElements = document.querySelectorAll('section');
hiddenElements.forEach((element) => observer.observe(element));

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
