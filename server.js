// 1. ПОДКЛЮЧАЕМ БИБЛИОТЕКИ

// Express - фреймворк для создания сервера
const express = require('express');
// CORS - разрешает запросы с других доменов/портов
// const cors = require('cors');
// bcryptjs - шифрование паролей
const bcrypt = require('bcryptjs');
// jsonwebtoken - создание токенов для авторизации
const jwt = require('jsonwebtoken');
// Наша база данных из файла database.js
const db = require('./database');

// 2. НАСТРОЙКИ СЕРВЕРА

// Создаем экземпляр приложения Express
const app = express();
// Определяем порт, на котором будет работать сервер
const PORT = 3000;

// Секретный ключ для подписи JWT-токенов
// В реальном проекте хранят в .env файле, но для практики оставим здесь
const SECRET_KEY = 'my_super_secret_key_123';

// МИДЛВЭР ДЛЯ ПРОВЕРКИ ТОКЕНА

function authenticateToken(req, res, next) {
    // 1. Получаем заголовок Authorization из запроса
    const authHeader = req.headers.authorization;
    
    // 2. Если заголовка нет — сразу ошибка
    if (!authHeader) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // 3. Токен приходит в формате "Bearer <токен>"
    //    Разбиваем строку по пробелу и берём вторую часть (сам токен)
    const token = authHeader.split(' ')[1];

    try {
        // 4. Проверяем токен с помощью секретного ключа
        //    Если токен просрочен или подделан — будет ошибка
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 5. Если всё ок — сохраняем данные пользователя в объект запроса
        //    Теперь в любом месте после этого мидлвэра мы можем получить req.user
        req.user = decoded;
        
        // 6. Передаём управление следующему обработчику (роуту)
        next();
    } catch (error) {
        // 7. Если токен невалидный — возвращаем 401
        res.status(401).json({ error: 'Невалидный токен' });
    }
}

// Подключаем middleware (промежуточные обработчики)
// app.use(cors());                      // Разрешаем кросс-доменные запросы
app.use(express.json());              // Учим сервер читать JSON из запросов
app.use(express.static('public'));    // Указываем папку со статическими файлами (HTML, CSS, JS)

// 3. ОБРАБОТЧИКИ ЗАПРОСОВ (РОУТЫ)

// РЕГИСТРАЦИЯ
// Обрабатываем POST-запрос на адрес /register
app.post('/register', async (req, res) => {
  // Получаем логин и пароль из тела запроса
  const { username, password } = req.body;

  // Проверяем, что поля не пустые
  if (!username || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  try {
    // Шифруем пароль с помощью bcrypt
    // 10 - количество раундов шифрования (чем больше, тем надежнее, но медленнее)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Добавляем пользователя в базу данных
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          // Если ошибка содержит 'UNIQUE' - значит пользователь уже существует
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
          }
          return res.status(500).json({ error: 'Ошибка сервера' });
        }
        // Возвращаем успешный ответ с ID нового пользователя
        res.json({ id: this.lastID, username });
      }
    );
  } catch (err) {
    // Любая другая ошибка
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ЛОГИН 
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Ищем пользователя в базе по логину
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      // Если пользователь не найден или ошибка
      if (err || !user) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Сравниваем введенный пароль с зашифрованным в базе
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Создаем JWT-токен
      // В токен мы кладем: id, username, role
      // Токен будет действителен 7 дней
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '7d' }
      );

      // Отправляем токен и данные пользователя
      res.json({
        token,
        username: user.username,
        role: user.role
      });
    }
  );
});

// ПРОВЕРКА ТОКЕНА (для защиты роутов)
// Этот роут проверяет, валидный ли токен у пользователя
app.get('/verify', (req, res) => {
  // Получаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  // Токен приходит в формате "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Проверяем токен с помощью секретного ключа
    const decoded = jwt.verify(token, SECRET_KEY);
    // Если токен валидный - возвращаем данные пользователя
    res.json({ valid: true, user: decoded });
  } catch (error) {
    // Если токен невалидный (просрочен или подделан)
    res.status(401).json({ error: 'Невалидный токен' });
  }
});


// РАБОТА С ТРЕНИРОВКАМИ (CRUD)

// Получить все тренировки пользователя (read)
app.get('/api/workouts', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(
        `SELECT * FROM workouts WHERE user_id = ? ORDER BY CASE status WHEN 'planned' THEN 0 ELSE 1 END,
        date ASC`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Ошибка БД:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            res.json(rows);
        }
    );
});

// Создать новую тренировку (create)
app.post('/api/workouts', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { title, date, description, exercises } = req.body; 

    if (!title || !date) {
        return res.status(400).json({ error: 'Название и дата обязательны' });
    }

    // Если exercises не пришли, ставим пустой массив
    const exercisesJson = exercises || '[]';

    db.run(
        `INSERT INTO workouts (user_id, title, date, description, status, exercises)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, title, date, description || '', 'planned', exercisesJson],
        function(err) {
            if (err) {
                console.error('Ошибка БД:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            res.json({ id: this.lastID });
        }
    );
});

// Обновить статус тренировки (выполнено / запланировано) (update)
app.put('/api/workouts/:id', authenticateToken, (req, res) => {
    const workoutId = req.params.id;
    const userId = req.user.id;
    const { status } = req.body;

    if (!status || !['planned', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Неверный статус' });
    }

    // Проверяем, что тренировка принадлежит пользователю
    db.get(
        'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
        [workoutId, userId],
        (err, workout) => {
            if (err || !workout) {
                return res.status(404).json({ error: 'Тренировка не найдена' });
            }

            db.run(
                'UPDATE workouts SET status = ? WHERE id = ?',
                [status, workoutId],
                function(err) {
                    if (err) {
                        console.error('Ошибка БД:', err.message);
                        return res.status(500).json({ error: 'Ошибка сервера' });
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});

// Удалить тренировку (delete)
app.delete('/api/workouts/:id', authenticateToken, (req, res) => {
    const workoutId = req.params.id;
    const userId = req.user.id;

    // Проверяем, что тренировка принадлежит пользователю
    db.get(
        'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
        [workoutId, userId],
        (err, workout) => {
            if (err || !workout) {
                return res.status(404).json({ error: 'Тренировка не найдена' });
            }

            db.run(
                'DELETE FROM workouts WHERE id = ?',
                [workoutId],
                function(err) {
                    if (err) {
                        console.error('Ошибка БД:', err.message);
                        return res.status(500).json({ error: 'Ошибка сервера' });
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});


// КОД ДЯЛ ИИ ПОМОЩНИКА

app.post('/api/ai-workout', authenticateToken, (req, res) => {
    const { level, equipment, goal, duration, frequency, count, sets, reps, intensity } = req.body;

    const levelMap = { '1': 1, '2': 2, '3': 3 };
    const difficulty = levelMap[level] || 1;

    // Определяем группы мышц
    let muscles = [];
    if (goal === 'накачаться') muscles = ['грудь', 'спина', 'ноги', 'плечи', 'руки'];
    else if (goal === 'похудеть') muscles = ['грудь', 'спина', 'ноги', 'пресс', 'кардио'];
    else muscles = ['грудь', 'спина', 'ноги', 'пресс'];

    db.all(
        'SELECT * FROM exercises WHERE equipment = ? AND difficulty <= ?',
        [equipment, difficulty],
        (err, exercises) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            const filtered = exercises.filter(ex => muscles.includes(ex.muscle_group));
            const grouped = {};
            filtered.forEach(ex => {
                if (!grouped[ex.muscle_group]) grouped[ex.muscle_group] = [];
                grouped[ex.muscle_group].push(ex);
            });

            // ИСПОЛЬЗУЕМ ИИ-РЕКОМЕНДАЦИИ
            // count — сколько упражнений (от ИИ)
            // intensity — интенсивность (от ИИ)
            // КОЛИЧЕСТВО УПРАЖНЕНИЙ ОТ ИИ
            let perWorkout = count || 4;
            // Дополнительно ограничиваем по времени
            if (duration <= 15) perWorkout = Math.min(perWorkout, 2);
            else if (duration <= 30) perWorkout = Math.min(perWorkout, 3);
            else if (duration <= 45) perWorkout = Math.min(perWorkout, 3);
            else perWorkout = Math.min(perWorkout, 4); // 60 мин — максимум 4

            const freq = parseInt(frequency) || 3;
            const step = freq <= 3 ? 2 : 1;

            const today = new Date();
            const workouts = [];
            const muscleKeys = Object.keys(grouped);

            for (let i = 0; i < freq; i++) {
                const groupIndex = i % muscleKeys.length;
                const currentMuscle = muscleKeys[groupIndex];
                const pool = grouped[currentMuscle] || [];

                const shuffled = pool.sort(() => Math.random() - 0.5);
                const count = Math.min(perWorkout, shuffled.length);
                const selected = shuffled.slice(0, count);

                let finalExercises = selected;
                if (finalExercises.length === 0) {
                    const all = filtered.sort(() => Math.random() - 0.5);
                    finalExercises = all.slice(0, Math.min(perWorkout, all.length));
                }

                // КОРРЕКТИРУЕМ КОЛИЧЕСТВО ПОДХОДОВ ОТ ИНТЕНСИВНОСТИ
                const intensityMultiplier = intensity || 2;
                finalExercises = finalExercises.map(ex => ({
                    ...ex,
                    default_sets: Math.round((ex.default_sets || 3) * (1 + (intensityMultiplier - 2) * 0.2))
                }));

                const date = new Date(today);
                date.setDate(date.getDate() + i * step);
                const dateStr = date.toISOString().split('T')[0];

                const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                const dayName = dayNames[date.getDay()] || 'Тренировка';

                workouts.push({
                    title: `${dayName} (${i + 1}/${freq})`,
                    date: dateStr,
                    intensity: intensity || 2,
                    exercises: finalExercises.map(ex => ({
                        name: ex.name,
                        sets: ex.default_sets || 3,
                        reps: ex.default_reps || 10,
                        weight: 0
                    }))
                });
            }

            if (workouts.length === 0) {
                return res.json({
                    workouts: [{
                        title: 'Базовая тренировка',
                        date: new Date().toISOString().split('T')[0],
                        intensity: 2,
                        exercises: [
                            { name: 'Отжимания', sets: 3, reps: 15 },
                            { name: 'Приседания', sets: 3, reps: 20 },
                            { name: 'Планка', sets: 3, reps: 30 }
                        ]
                    }]
                });
            }

            res.json({ workouts });
        }
    );
});

// РОУТЫ ДЛЯ АДМИНКИ

// Получить всех пользователей
app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });

    db.all('SELECT id, username, role FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(rows);
    });
});

// Получить тренировки пользователя
app.get('/api/admin/workouts/:userId', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });

    db.all(
        'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC',
        [req.params.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Ошибка сервера' });
            res.json(rows);
        }
    );
});

// Удалить тренировку
app.delete('/api/admin/workouts/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });

    db.run('DELETE FROM workouts WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ success: true });
    });
});


// СТАТИСТИКА

app.get('/api/stats', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(
        'SELECT status, COUNT(*) as count FROM workouts WHERE user_id = ? GROUP BY status',
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Ошибка БД:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            // Находим количество выполненных и запланированных
            let completed = 0;
            let planned = 0;

            rows.forEach(row => {
                if (row.status === 'completed') completed = row.count;
                if (row.status === 'planned') planned = row.count;
            });

            res.json({ completed, planned });
        }
    );
});


// 4. ЗАПУСК СЕРВЕРА

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`Открой в браузере: http://localhost:${PORT}`);
});