// Подключаем библиотеку sqlite3 для работы с БД
const sqlite3 = require('sqlite3').verbose();
// Подключаем модуль path для работы с путями к файлам
const path = require('path');

// Создаем подключение к базе данных
// __dirname - это путь к текущей папке (workout-tracker)
// database.db - файл, где будут храниться все данные
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// db.serialize() - выполняет команды по порядку, одна за другой
db.serialize(() => {
  // ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ 
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- уникальный номер (1, 2, 3...)
      username TEXT UNIQUE NOT NULL,         -- логин (не может повторяться)
      password TEXT NOT NULL,                -- пароль (зашифрованный)
      role TEXT DEFAULT 'user'               -- роль: 'user' или 'admin'
    )
  `);

  // ТАБЛИЦА ТРЕНИРОВОК
  db.run(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- уникальный номер тренировки
      user_id INTEGER NOT NULL,              -- кто создал (связь с users)
      title TEXT NOT NULL,                   -- название (например, "Тренировка ног")
      date TEXT NOT NULL,                    -- дата и время (например, "2026-07-09 18:00")
      description TEXT,                      -- описание (текст)
      status TEXT DEFAULT 'planned',         -- статус: 'planned' или 'completed'
      is_template INTEGER DEFAULT 0,         -- 0 - обычная, 1 - шаблон
      template_type TEXT,                    -- 'day', 'week', 'month'
      exercises TEXT,                        -- JSON строка с упражнениями
      duration INTEGER,                      -- длительность в минутах
      feeling INTEGER,                       -- оценка самочувствия (1-10)
      FOREIGN KEY (user_id) REFERENCES users (id)  -- связь с таблицей users
    )
  `);
  // Добавляем индекс для ускорения поиска по user_id
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id)
  `);

  // ТАБЛИЦА УПРАЖНЕНИЙ (для ИИ-помощника)
  db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,                    -- Название упражнения
      muscle_group TEXT NOT NULL,            -- 'грудь', 'спина', 'ноги', 'плечи', 'пресс', 'руки', 'кардио'
      equipment TEXT NOT NULL,               -- 'турник', 'брусья', 'пол', 'гантели', 'резинка'
      difficulty INTEGER DEFAULT 1,          -- 1 - новичок, 2 - средний, 3 - продвинутый
      description TEXT,                      -- Техника выполнения
      default_sets INTEGER DEFAULT 3,        -- Количество подходов по умолчанию
      default_reps INTEGER DEFAULT 10        -- Количество повторений по умолчанию
    )
  `);

  console.log('База данных и таблицы созданы');
});

// Экспортируем базу данных, чтобы использовать в других файлах
module.exports = db;