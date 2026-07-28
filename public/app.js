// 1. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК

// Находим все кнопки вкладок
const tabs = document.querySelectorAll('.tab');
// Находим контейнеры форм
const forms = {
    login: document.getElementById('login'),
    register: document.getElementById('register')
};

// Для каждой кнопки добавляем обработчик клика
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Убираем класс active у всех вкладок
        tabs.forEach(t => t.classList.remove('active'));
        // Добавляем класс active только нажатой вкладке
        tab.classList.add('active');

        // Получаем имя вкладки из атрибута data-tab
        const tabName = tab.dataset.tab;
        
        // Скрываем все формы
        Object.keys(forms).forEach(key => {
            forms[key].classList.remove('active');
        });
        // Показываем нужную форму
        forms[tabName].classList.add('active');
    });
});

// 2. РЕГИСТРАЦИЯ

// Находим форму регистрации и добавляем обработчик отправки
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Отменяем перезагрузку страницы

    // Считываем значения из полей ввода
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const message = document.getElementById('registerMessage');

    // Проверяем, что поля не пустые
    if (!username || !password) {
        message.className = 'message error';
        message.textContent = 'Введите логин и пароль';
        return;
    }

    try {
        // Отправляем запрос на сервер
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        // Получаем ответ от сервера
        const data = await response.json();

        if (response.ok) {
            // Если всё хорошо (статус 200)
            message.className = 'message success';
            message.textContent = 'Регистрация успешна! Теперь войдите.';
            
            // Очищаем поля
            document.getElementById('regUsername').value = '';
            document.getElementById('regPassword').value = '';
            
            // Переключаем на вкладку входа (имитируем клик)
            document.querySelector('[data-tab="login"]').click();
        } else {
            // Если ошибка
            message.className = 'message error';
            message.textContent = (data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        // Если не удалось подключиться к серверу
        message.className = 'message error';
        message.textContent = 'Ошибка подключения к серверу. Запусти node server.js';
    }
});

// 3. ЛОГИН

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const message = document.getElementById('loginMessage');

    // Проверяем, что поля не пустые
    if (!username || !password) {
        message.className = 'message error';
        message.textContent = 'Введите логин и пароль';
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Сохраняем токен и данные в localStorage (хранилище браузера)
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);

            message.className = 'message success';
            message.textContent = 'Вход выполнен! Перенаправление...';
            
            // Через 1 секунду переходим на страницу дашборда
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            message.className = 'message error';
            message.textContent = (data.error || 'Ошибка входа');
        }
    } catch (error) {
        message.className = 'message error';
        message.textContent = 'Ошибка подключения к серверу. Запусти node server.js';
    }
});