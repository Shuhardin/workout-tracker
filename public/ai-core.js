const model = {
    predict: function(level, time) {
        // КОЛИЧЕСТВО УПРАЖНЕНИЙ
        let count;
        if (time <= 15) count = 1;
        else if (time <= 30) count = 2;
        else if (time <= 45) count = 3;
        else count = 4;

        if (level === 3 && time >= 45) count += 1;
        if (level === 1) count = Math.min(count, 3);

        // ПОДХОДЫ (зависят от времени)
        let sets;
        if (time <= 15) {
            sets = 2; // 15 минут → 2 подхода
        } else if (time <= 30) {
            sets = 3; // 30 минут → 3 подхода
        } else if (time <= 45) {
            sets = 3;
        } else {
            sets = 4; // 60 минут → 4 подхода
        }

        // Корректировка по уровню
        if (level === 3 && time >= 45) sets = 4;
        if (level === 1 && time <= 30) sets = Math.min(sets, 3);

        // ПОВТОРЕНИЯ
        let reps;
        if (level === 1) reps = 12;
        else if (level === 2) reps = 10;
        else reps = 10;

        // ИНТЕНСИВНОСТЬ
        let intensity;
        if (level === 1) intensity = 1;
        else if (level === 2) intensity = 2;
        else intensity = 3;

        return { count, sets, reps, intensity };
    }
};

console.log('🧠 Умный алгоритм загружен!');

window.predict = model.predict.bind(model);
window.isAiReady = true;