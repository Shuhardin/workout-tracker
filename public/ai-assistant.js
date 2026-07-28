// 1. ПРОВЕРКА ТОКЕНА

const token = localStorage.getItem('token');
if (!token) window.location.href = '/';

// 2. ЭЛЕМЕНТЫ СТРАНИЦЫ

const form = document.getElementById('aiForm');
const resultDiv = document.getElementById('result');
const workoutList = document.getElementById('workoutList');
const msg = document.getElementById('msg');
let currentWorkouts = [];

// 3. ОЖИДАНИЕ ЗАГРУЗКИ МОДЕЛИ

function waitForModel() {
    return new Promise((resolve) => {
        if (window.isAiReady) {
            resolve();
            return;
        }
        const check = setInterval(() => {
            if (window.isAiReady) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
}

// 4. ОБРАБОТЧИК ФОРМЫ

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ждём загрузки модели
    await waitForModel();

    const level = parseInt(document.getElementById('level').value);
    const equipment = document.getElementById('equipment').value;
    const goal = document.getElementById('goal').value;
    const duration = parseInt(document.getElementById('duration').value);
    const frequency = parseInt(document.getElementById('frequency').value);

    // Получаем рекомендации от нейросети
    const recommendation = window.predict(level, duration);
    const recommendedCount = recommendation.count;
    const intensity = recommendation.intensity;

    console.log('🧠 Нейросеть рекомендует:', {
        упражнений: recommendedCount,
        интенсивность: intensity
    });

    resultDiv.style.display = 'block';
    workoutList.innerHTML = '⏳ Генерация плана...';
    msg.textContent = '';

    try {
        const res = await fetch('/api/ai-workout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                level,
                equipment,
                goal,
                duration,
                frequency,
                count: recommendedCount,
                intensity: intensity
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка генерации');

        currentWorkouts = data.workouts;

        workoutList.innerHTML = currentWorkouts.map((w, i) => `
            <div class="workout-card">
                <strong>${i + 1}. ${w.title}</strong>
                <div class="date">📅 ${w.date}</div>
                <div class="exercises">
                    ${w.exercises.map(ex => `<span>${ex.name} (${ex.sets}×${ex.reps})</span>`).join('')}
                </div>
                <div style="font-size:12px;color:#888;margin-top:5px;">
                    🧠 Нейросеть рекомендовала ${w.exercises.length} упражнений, интенсивность ${w.intensity || intensity}
                </div>
            </div>
        `).join('');

    } catch (err) {
        workoutList.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
});

// 5. СОХРАНЕНИЕ

document.getElementById('saveBtn').addEventListener('click', async () => {
    if (!currentWorkouts.length) {
        msg.textContent = '❌ Сначала сгенерируйте план';
        msg.className = 'msg error';
        return;
    }

    let saved = 0;
    for (const w of currentWorkouts) {
        const exercises = JSON.stringify(w.exercises);
        try {
            const res = await fetch('/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: w.title,
                    date: w.date,
                    description: '',
                    exercises
                })
            });
            if (res.ok) saved++;
        } catch (e) {}
    }

    if (saved === currentWorkouts.length) {
        msg.textContent = `✅ Все ${saved} тренировок сохранены!`;
        msg.className = 'msg success';
    } else {
        msg.textContent = `⚠️ Сохранено ${saved} из ${currentWorkouts.length}`;
        msg.className = 'msg error';
    }
});