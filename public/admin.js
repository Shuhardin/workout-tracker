// Проверка доступа
const token = localStorage.getItem('token');
if (!token || localStorage.getItem('role') !== 'admin') {
    window.location.href = '/';
}

// Элементы
const usersList = document.getElementById('usersList');
const workoutsSection = document.getElementById('workoutsSection');
const userWorkoutsList = document.getElementById('userWorkoutsList');
const userWorkoutsTitle = document.getElementById('userWorkoutsTitle');
const adminMsg = document.getElementById('adminMsg');

// Загрузка пользователей
async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка');
        const users = await res.json();

        if (!users.length) {
            usersList.innerHTML = '<p>Нет пользователей</p>';
            return;
        }

        usersList.innerHTML = `
            <table>
                <tr><th>ID</th><th>Имя</th><th>Роль</th><th></th></tr>
                ${users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td><span class="role-badge ${u.role}">${u.role}</span></td>
                        <td><button class="btn btn-view" data-id="${u.id}" data-name="${u.username}">👁️</button></td>
                    </tr>
                `).join('')}
            </table>
        `;

        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
                loadUserWorkouts(btn.dataset.id, btn.dataset.name);
            });
        });
    } catch {
        usersList.innerHTML = '<p style="color:red;">❌ Ошибка загрузки</p>';
    }
}

// Загрузка тренировок пользователя
async function loadUserWorkouts(userId, userName) {
    try {
        usersList.style.display = 'none';
        workoutsSection.style.display = 'block';
        userWorkoutsTitle.textContent = `🏋️ ${userName}`;
        userWorkoutsList.innerHTML = '⏳ Загрузка...';
        adminMsg.textContent = '';

        const res = await fetch(`/api/admin/workouts/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка');

        const workouts = await res.json();

        if (!workouts.length) {
            userWorkoutsList.innerHTML = '<p>📭 Нет тренировок</p>';
            return;
        }

        //СЧИТАЕМ СТАТИСТИКУ ПО ПОЛЬЗОВАТЕЛЮ
        const completedCount = workouts.filter(w => w.status === 'completed').length;
        const plannedCount = workouts.filter(w => w.status === 'planned').length;

        const statsBlock = document.getElementById('userStatsBlock');
        const ctx = document.getElementById('userStatsChart').getContext('2d');

        if (completedCount + plannedCount > 0) {
            statsBlock.style.display = 'block';

            // Удаляем старую диаграмму, если она есть
            if (window.userStatsChartInstance) {
                window.userStatsChartInstance.destroy();
            }

            window.userStatsChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['✅ Выполнено', '⏳ Запланировано'],
                    datasets: [{
                        data: [completedCount, plannedCount],
                        backgroundColor: ['#4CAF50', '#FFC107'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { size: 10 } }
                        }
                    }
                }
            });
        } else {
            statsBlock.style.display = 'none';
        }

        userWorkoutsList.innerHTML = workouts.map(w => `
            <div class="workout-item">
                <div class="info">
                    <div class="title">${w.title}</div>
                    <div class="date">📅 ${w.date}</div>
                    <div>${w.status === 'completed' ? '✅' : '⏳'}</div>
                </div>
                <button class="btn btn-del" data-id="${w.id}">🗑</button>
            </div>
        `).join('');

        document.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', () => deleteWorkout(btn.dataset.id, userId, userName));
        });
    } catch {
        userWorkoutsList.innerHTML = '<p style="color:red;">❌ Ошибка</p>';
    }
}

// Удаление тренировки
async function deleteWorkout(workoutId, userId, userName) {
    if (!confirm('Удалить?')) return;
    try {
        const res = await fetch(`/api/admin/workouts/${workoutId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка');
        adminMsg.textContent = '✅ Удалено';
        adminMsg.className = 'msg success';
        loadUserWorkouts(userId, userName);
    } catch {
        adminMsg.textContent = '❌ Ошибка';
        adminMsg.className = 'msg error';
    }
}

// Кнопка "Назад"
document.getElementById('backToUsers').addEventListener('click', (e) => {
    e.preventDefault();
    usersList.style.display = 'block';
    workoutsSection.style.display = 'none';
    adminMsg.textContent = '';
});

loadUsers();