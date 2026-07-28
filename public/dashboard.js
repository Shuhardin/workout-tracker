// 1. ПРОВЕРКА ТОКЕНА

const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (!token) {
    window.location.href = '/';
}

document.getElementById('usernameDisplay').textContent = username;

// ССЫЛКА НА АДМИН ПАНЕЛЬ

// Показываем ссылку на админку только админам
const role = localStorage.getItem('role');
const adminLink = document.getElementById('adminLink');

if (role === 'admin') {
    adminLink.style.display = 'inline-block';
} else {
    adminLink.style.display = 'none';
}

// 2. ВЫХОД

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
});

// 3. РАБОТА С УПРАЖНЕНИЯМИ В ФОРМЕ

const exercisesContainer = document.getElementById('exercisesContainer');

function createExerciseRow(name = '', sets = '', reps = '', weight = '') {
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.innerHTML = `
        <input class="ex-name" type="text" placeholder="Упражнение" value="${escapeHtml(name)}">
        <input class="ex-sets" type="number" placeholder="Подходы" value="${sets}" min="1">
        <input class="ex-reps" type="number" placeholder="Повторы" value="${reps}" min="1">
        <input class="ex-weight" type="number" placeholder="Вес (кг)" value="${weight}" min="0" step="0.5">
        <button type="button" class="remove-ex-btn">✕</button>
    `;

    div.querySelector('.remove-ex-btn').addEventListener('click', () => {
        if (exercisesContainer.children.length > 1) {
            div.remove();
        } else {
            showMessage('Должно быть хотя бы одно упражнение', 'error');
        }
    });

    return div;
}

function getExercisesFromForm() {
    const rows = exercisesContainer.querySelectorAll('.exercise-item');
    const result = [];
    rows.forEach(row => {
        const name = row.querySelector('.ex-name').value.trim();
        if (name === '') return;
        const sets = parseInt(row.querySelector('.ex-sets').value) || 0;
        const reps = parseInt(row.querySelector('.ex-reps').value) || 0;
        const weight = parseFloat(row.querySelector('.ex-weight').value) || 0;
        result.push({ name, sets, reps, weight });
    });
    return result;
}

// Добавляем первую пустую строку упражнения
exercisesContainer.appendChild(createExerciseRow());

// Кнопка "Добавить упражнение"
document.getElementById('addExerciseBtn').addEventListener('click', () => {
    exercisesContainer.appendChild(createExerciseRow());
});

// 4. ЗАГРУЗКА ТРЕНИРОВОК

const workoutList = document.getElementById('workoutList');
const message = document.getElementById('workoutMessage');

async function loadWorkouts() {
    try {
        const response = await fetch('/api/workouts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = '/';
                return;
            }
            throw new Error('Ошибка загрузки');
        }

        const workouts = await response.json();
        renderWorkouts(workouts);
    } catch (error) {
        workoutList.innerHTML = `<p class="loading">❌ Ошибка загрузки</p>`;
    }
}

// 5. ОТОБРАЖЕНИЕ ТРЕНИРОВОК

function renderWorkouts(workouts) {
    if (!workouts.length) {
        workoutList.innerHTML = `<p class="loading">Нет тренировок</p>`;
        return;
    }

    workoutList.innerHTML = workouts.map(w => {
        // Парсим упражнения из JSON
        let exercisesHtml = '';
        try {
            const exercises = JSON.parse(w.exercises || '[]');
            if (exercises.length > 0) {
                exercisesHtml = `
                    <div class="exercises-list">
                        <div class="exercises-title">📋 Упражнения:</div>
                        <ul>
                            ${exercises.map(ex =>
                                `<li>${escapeHtml(ex.name)} — ${ex.sets}×${ex.reps} ${ex.weight ? `(${ex.weight} кг)` : ''}</li>`
                            ).join('')}
                        </ul>
                    </div>
                `;
            }
        } catch (e) {
            exercisesHtml = '';
        }

        return `
            <div class="workout-item ${w.status === 'completed' ? 'completed' : ''}">
                <div class="info">
                    <div class="title">${escapeHtml(w.title)}</div>
                    <div class="date">📅 ${w.date}</div>
                    ${w.description ? `<div class="description">📝 ${escapeHtml(w.description)}</div>` : ''}
                    ${exercisesHtml}
                    <div class="status">${w.status === 'completed' ? '✅ Выполнена' : '⏳ Запланирована'}</div>
                </div>
                <div class="actions">
                    ${w.status !== 'completed' ? `<button class="complete-btn" data-id="${w.id}">✅ Выполнено</button>` : ''}
                    <button class="delete-btn" data-id="${w.id}">🗑 Удалить</button>
                </div>
            </div>
        `;
    }).join('');

    // Обработчики кнопок
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', () => completeWorkout(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteWorkout(btn.dataset.id));
    });
}

// 6. ДОБАВЛЕНИЕ ТРЕНИРОВКИ

document.getElementById('workoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('workoutTitle').value.trim();
    const date = document.getElementById('workoutDate').value;
    const description = document.getElementById('workoutDescription').value.trim();
    const exercises = getExercisesFromForm();

    if (!title || !date) {
        showMessage('Заполните название и дату', 'error');
        return;
    }

    if (exercises.length === 0) {
        showMessage('Добавьте хотя бы одно упражнение', 'error');
        return;
    }

    try {
        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                date,
                description,
                exercises: JSON.stringify(exercises)
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Ошибка добавления');
        }

        showMessage('✅ Тренировка добавлена!', 'success');

        // Очищаем форму
        document.getElementById('workoutTitle').value = '';
        document.getElementById('workoutDate').value = '';
        document.getElementById('workoutDescription').value = '';
        exercisesContainer.innerHTML = '';
        exercisesContainer.appendChild(createExerciseRow());

        loadWorkouts();
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    }
});

// 7. ОБНОВЛЕНИЕ СТАТУСА

async function completeWorkout(id) {
    try {
        const response = await fetch(`/api/workouts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) throw new Error('Ошибка обновления');
        loadWorkouts();
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    }
}

// 8. УДАЛЕНИЕ ТРЕНИРОВКИ

async function deleteWorkout(id) {
    if (!confirm('Удалить тренировку?')) return;

    try {
        const response = await fetch(`/api/workouts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка удаления');
        loadWorkouts();
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    }
}

// 9. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.textContent = '';
        message.className = 'message';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 10. ЗАГРУЗКА ПРИ СТАРТЕ

loadWorkouts();

// СТАТИСТИКА

async function loadStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка загрузки статистики');

        const stats = await response.json();

        const ctx = document.getElementById('statsChart').getContext('2d');

        // Если диаграмма уже существует — уничтожаем её
        if (window.statsChartInstance) {
            window.statsChartInstance.destroy();
        }

        // Создаём круговую диаграмму
        window.statsChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Выполнено', 'Запланировано'],
                datasets: [{
                    data: [stats.completed, stats.planned],
                    backgroundColor: ['#4CAF50', '#FFC107'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка статистики:', error);
        // Показываем заглушку, если статистика не загрузилась
        const ctx = document.getElementById('statsChart');
        if (ctx) {
            ctx.parentElement.innerHTML = `<p style="text-align:center;color:#999;">Нет данных для статистики</p>`;
        }
    }
}

loadStats();