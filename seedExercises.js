const db = require('./database');

const exercises = [
    // УЛИЦА (турник, брусья, пол) 
    { name: 'Подтягивания широким хватом', muscle_group: 'спина', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 8 },
    { name: 'Подтягивания узким хватом', muscle_group: 'спина', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 8 },
    { name: 'Подтягивания обратным хватом', muscle_group: 'спина', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 8 },
    { name: 'Подтягивания за голову', muscle_group: 'спина', equipment: 'улица', difficulty: 3, default_sets: 3, default_reps: 6 },
    { name: 'Выход силой на турнике', muscle_group: 'спина', equipment: 'улица', difficulty: 3, default_sets: 3, default_reps: 5 },
    { name: 'Отжимания на брусьях', muscle_group: 'грудь', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Отжимания от пола широким хватом', muscle_group: 'грудь', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Отжимания от пола узким хватом', muscle_group: 'руки', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 12 },
    { name: 'Отжимания с хлопком', muscle_group: 'грудь', equipment: 'улица', difficulty: 3, default_sets: 3, default_reps: 8 },
    { name: 'Отжимания в стойке на руках (у стенки)', muscle_group: 'плечи', equipment: 'улица', difficulty: 3, default_sets: 3, default_reps: 6 },
    { name: 'Подъем ног в висе на турнике', muscle_group: 'пресс', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 15 },
    { name: 'Подъем коленей в висе', muscle_group: 'пресс', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 20 },
    { name: 'Скручивания на полу', muscle_group: 'пресс', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 20 },
    { name: 'Боковые скручивания', muscle_group: 'пресс', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Приседания', muscle_group: 'ноги', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 20 },
    { name: 'Выпады', muscle_group: 'ноги', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 12 },
    { name: 'Бег на месте', muscle_group: 'кардио', equipment: 'улица', difficulty: 1, default_sets: 1, default_reps: 60 },
    { name: 'Бурпи', muscle_group: 'кардио', equipment: 'улица', difficulty: 2, default_sets: 3, default_reps: 10 },
    { name: 'Прыжки на скакалке', muscle_group: 'кардио', equipment: 'улица', difficulty: 1, default_sets: 3, default_reps: 30 },

    //ЗАЛ (штанга, гантели, тренажёры) 
    { name: 'Приседания со штангой', muscle_group: 'ноги', equipment: 'зал', difficulty: 2, default_sets: 4, default_reps: 10 },
    { name: 'Жим штанги лежа', muscle_group: 'грудь', equipment: 'зал', difficulty: 2, default_sets: 4, default_reps: 10 },
    { name: 'Тяга штанги в наклоне', muscle_group: 'спина', equipment: 'зал', difficulty: 2, default_sets: 4, default_reps: 10 },
    { name: 'Мертвая тяга', muscle_group: 'спина', equipment: 'зал', difficulty: 3, default_sets: 4, default_reps: 8 },
    { name: 'Жим гантелей сидя', muscle_group: 'плечи', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Разводка гантелей лежа', muscle_group: 'грудь', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Сгибание рук с гантелями', muscle_group: 'руки', equipment: 'зал', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Разгибание рук с гантелями', muscle_group: 'руки', equipment: 'зал', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Жим ногами в тренажёре', muscle_group: 'ноги', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Разгибание ног в тренажёре', muscle_group: 'ноги', equipment: 'зал', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Сгибание ног в тренажёре', muscle_group: 'ноги', equipment: 'зал', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Тяга верхнего блока к груди', muscle_group: 'спина', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Тяга нижнего блока сидя', muscle_group: 'спина', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Сведение рук в тренажёре (бабочка)', muscle_group: 'грудь', equipment: 'зал', difficulty: 2, default_sets: 3, default_reps: 12 },

    // ДОМ (пол, стул, стена) 
    { name: 'Отжимания от пола', muscle_group: 'грудь', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Отжимания с узкой постановкой рук', muscle_group: 'руки', equipment: 'дом', difficulty: 2, default_sets: 3, default_reps: 12 },
    { name: 'Отжимания с широкой постановкой рук', muscle_group: 'грудь', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Отжимания от стула (на трицепс)', muscle_group: 'руки', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 12 },
    { name: 'Приседания', muscle_group: 'ноги', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 20 },
    { name: 'Приседания сумо', muscle_group: 'ноги', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Выпады', muscle_group: 'ноги', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 12 },
    { name: 'Зашагивания на стул', muscle_group: 'ноги', equipment: 'дом', difficulty: 2, default_sets: 3, default_reps: 10 },
    { name: 'Скручивания на полу', muscle_group: 'пресс', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 20 },
    { name: 'Боковые скручивания', muscle_group: 'пресс', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Обратные скручивания', muscle_group: 'пресс', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
    { name: 'Планка', muscle_group: 'пресс', equipment: 'дом', difficulty: 2, default_sets: 3, default_reps: 30 },
    { name: 'Бурпи', muscle_group: 'кардио', equipment: 'дом', difficulty: 2, default_sets: 3, default_reps: 10 },
    { name: 'Скалолаз (горный альпинист)', muscle_group: 'кардио', equipment: 'дом', difficulty: 2, default_sets: 3, default_reps: 20 },
    { name: 'Прыжки на месте', muscle_group: 'кардио', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 30 },
    { name: 'Лодочка (гиперэкстензия на полу)', muscle_group: 'спина', equipment: 'дом', difficulty: 1, default_sets: 3, default_reps: 15 },
];

// Заполняем таблицу
exercises.forEach(ex => {
    db.run(
        `INSERT OR IGNORE INTO exercises 
         (name, muscle_group, equipment, difficulty, default_sets, default_reps) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ex.name, ex.muscle_group, ex.equipment, ex.difficulty, ex.default_sets, ex.default_reps]
    );
});

console.log('База упражнений заполнена!');