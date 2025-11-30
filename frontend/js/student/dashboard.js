document.addEventListener('DOMContentLoaded', () => {
	checkAuth();
	const user = getUser();

	const avatarEl = document.querySelector('.user-avatar');
	const nameSpan = document.querySelector('.user-area span');

	if (user) {
		if (nameSpan) nameSpan.textContent = formatShortName(user);
		if (avatarEl) {
			const f = (user.firstName || '').charAt(0) || '';
			const l = (user.lastName || '').charAt(0) || '';
			avatarEl.textContent = (f + l).toUpperCase();
		}
	}

	const toggle = document.getElementById('userDropdownToggle');
	const menu = document.getElementById('userDropdownMenu');

	function toggleDropdown() {
		const isVisible = menu.style.display === 'block';
		menu.style.display = isVisible ? 'none' : 'block';
		toggle.classList.toggle('active', !isVisible);
	}

	if (toggle) {
		toggle.addEventListener('click', (event) => {
			event.stopPropagation();
			toggleDropdown();
		});
	}

	document.addEventListener('click', (event) => {
		if (!toggle.contains(event.target) && !menu.contains(event.target)) {
			if (menu.style.display === 'block') {
				menu.style.display = 'none';
				toggle.classList.remove('active');
			}
		}
	});

	const timeFilterButtons = document.querySelectorAll('.time-filter .btn');
	timeFilterButtons.forEach(button => {
		button.addEventListener('click', () => {
			timeFilterButtons.forEach(btn => btn.classList.remove('active'));
			button.classList.add('active');
			console.log('Выбран период:', button.textContent);
		});
	});
});

// Форматирует имя в строку `Фамилия И.О.`
function formatShortName(user) {
	if (!user) return '';
	const last = user.lastName || '';
	const first = user.firstName || '';
	const middle = user.middleName || '';
	const f = first ? first.charAt(0) + '.' : '';
	const m = middle ? middle.charAt(0) + '.' : '';
	return `${last} ${f}${m}`.trim();
}
