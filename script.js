const prayerTimePerDay = document.getElementById('prayerTimePerDay')
const calendar = document.getElementById('calendar')
const nextPrayerCountdown = document.getElementById('nextPrayerCountdown')
let countdownInterval

function createCalendar(daysInMonth) {
	calendar.innerHTML = ''
	const today = new Date().getDate();
	for (let day = 1; day <= daysInMonth; day++) {
		const cell = document.createElement('button');

		cell.textContent = day;

		if (day === today) {
			cell.classList.add('selected');
		}

		cell.addEventListener('click', (event) => {
			// 1. Удаляем класс selected у всех кнопок календаря
			document.querySelectorAll('#calendar button').forEach(btn => {
				btn.classList.remove('selected');
			});
			// 2. Добавляем класс selected к нажатой кнопке
			event.target.classList.add('selected');

			if (day === new Date().getDate()) {
				showTodayPrayerTimes();
			} else {
				showPrayerTimes(year, month, day);
			}
		});

		calendar.appendChild(cell);
	}
}
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
createCalendar(new Date(year, month + 1, 0).getDate());


function showPrayerTimes(year, month, day) {
	clearInterval(countdownInterval);
	nextPrayerCountdown.textContent = '';
	const date = `${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
	const selectedDate = new Date(year, month, day);
	const file = getPrayerFile(selectedDate);

	fetch(file)
		.then(response => {
			if (!response.ok) {
				throw new Error('File not found');
			}
			return response.json();
		})
		.then(data => {
			const times = data[date]
			if (!times) {
				prayerTimePerDay.textContent = `Prayer times are not available for ${date}.`;
				return;
			}


			prayerTimePerDay.innerHTML = `
    <h2>Prayer times - ${date}</h2>
    <p>Fajr: <span>${times.Fajr}</span></p>
    <p>Sunrise: <span>${times.Sunrise}</span></p>
    <p>Dhuhr: <span>${times.Dhuhr}</span></p>
    <p>Asr: <span>${times.Asr}</span></p>
    <p>Maghrib: <span>${times.Maghrib}</span></p>
    <p>Isha: <span>${times.Isha}</span></p>
`;
		})
		.catch(() => {
			prayerTimePerDay.textContent = 'Could not load prayer times.';
		})
}


function getTodayDate() {
	const today = new Date();

	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}


function getPrayerFile(date) {
	const month = date.getMonth();

	const months = [
		'january', 'february', 'march', 'april',
		'may', 'june', 'july', 'august',
		'september', 'october', 'november', 'december'
	];

	return `${months[month]}.json`;
}


function showTodayPrayerTimes() {
	const now = new Date();
	const todayDate = getTodayDate();
	const file = getPrayerFile(now);

	fetch(file)
		.then(response => {
			if (!response.ok) {
				throw new Error('File not found')
			}
			return response.json()
		})
		.then(data => {
			const times = data[todayDate];

			if (!times) {
				prayerTimePerDay.textContent =
					`Prayer times are not available for ${todayDate}.`;
				nextPrayerCountdown.textContent = '';
				return;
			}

			prayerTimePerDay.innerHTML = `
                <h2>Prayer times - ${todayDate}</h2>
                <p>Fajr: <span>${times.Fajr}</span></p>
                <p>Sunrise: <span>${times.Sunrise}</span></p>
                <p>Dhuhr: <span>${times.Dhuhr}</span></p>
                <p>Asr: <span>${times.Asr}</span></p>
                <p>Maghrib: <span>${times.Maghrib}</span></p>
                <p>Isha: <span>${times.Isha}</span></p>
            `;

			const currentTime =
				`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

			const prayerNames = [
				'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'
			];

			let nextPrayer = null;

			for (const prayer of prayerNames) {
				if (times[prayer] > currentTime) {
					nextPrayer = prayer;
					break;
				}
			}

			let prayerDate;

			if (nextPrayer) {
				const parts = times[nextPrayer].split(':');
				const hours = Number(parts[0]);
				const minutes = Number(parts[1]);

				prayerDate = new Date(now);
				prayerDate.setHours(hours, minutes, 0, 0);
			} else {
				const tomorrow = new Date(now);
				tomorrow.setDate(tomorrow.getDate() + 1);

				const tomorrowDate =
					`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

				const tomorrowFile = getPrayerFile(tomorrow);

				fetch(tomorrowFile)
					.then(response => {
						if (!response.ok) {
							throw new Error('File was not found')
						}
						return response.json()
					})
					.then(tomorrowData => {
						const tomorrowTimes = tomorrowData[tomorrowDate];

						if (!tomorrowTimes || !tomorrowTimes.Fajr) {
							nextPrayerCountdown.textContent =
								"Tomorrow's Fajr time is unavailable.";
							return;
						}

						const parts = tomorrowTimes.Fajr.split(':');
						const hours = Number(parts[0]);
						const minutes = Number(parts[1]);

						const fajrDate = new Date(tomorrow);
						fajrDate.setHours(hours, minutes, 0, 0);

						updateCountdown(fajrDate, 'Fajr');

						clearInterval(countdownInterval);
						countdownInterval = setInterval(() => {
							if (Date.now() >= fajrDate.getTime()) {
								clearInterval(countdownInterval);
								showTodayPrayerTimes();
								return;
							}

							updateCountdown(fajrDate, 'Fajr');
						}, 1000);
					})
					.catch(() => {
						nextPrayerCountdown.textContent = 'Could not load prayer times.';
					})

				return;
			}

			updateCountdown(prayerDate, nextPrayer);
			clearInterval(countdownInterval);
			countdownInterval = setInterval(() => {
				if (Date.now() >= prayerDate.getTime()) {
					clearInterval(countdownInterval);
					showTodayPrayerTimes();
					return;
				}

				updateCountdown(prayerDate, nextPrayer);
			}, 1000);
		}
		)
		.catch(() => {
			prayerTimePerDay.textContent = 'Could not load prayer times.';
		})
}



function updateCountdown(prayerDate, nextPrayer) {
	const now = Date.now();
	const prayerTimestamp = prayerDate.getTime();

	const remaining = prayerTimestamp - now;
	const totalSeconds = Math.max(0, Math.floor(remaining / 1000));

	const hoursLeft = Math.floor(totalSeconds / 3600);
	const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
	const secondsLeft = totalSeconds % 60;

	nextPrayerCountdown.textContent =
		`Next prayer: ${nextPrayer}, left — ${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
}

showTodayPrayerTimes();