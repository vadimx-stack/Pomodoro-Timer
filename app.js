document.addEventListener('DOMContentLoaded', () => {
    const timer = document.getElementById('timer');
    const modePomodoro = document.getElementById('mode-pomodoro');
    const modeShortBreak = document.getElementById('mode-short-break');
    const modeLongBreak = document.getElementById('mode-long-break');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const pomodoroTimeInput = document.getElementById('pomodoro-time');
    const shortBreakTimeInput = document.getElementById('short-break-time');
    const longBreakTimeInput = document.getElementById('long-break-time');
    const autoStartInput = document.getElementById('auto-start');
    const notificationInput = document.getElementById('notification');
    const saveSettingsBtn = document.getElementById('save-settings');
    const completedPomodoros = document.getElementById('completed-pomodoros');
    const totalTime = document.getElementById('total-time');
    const sessionsHistory = document.getElementById('sessions-history');
    const notificationBox = document.getElementById('notification-box');
    const timerProgress = document.querySelector('.timer-progress');
    
    let countdown;
    let secondsLeft = 0;
    let isRunning = false;
    let currentMode = 'pomodoro';
    let completedCount = 0;
    let totalMinutes = 0;
    let initialSeconds = 0;
    
    const settings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        autoStart: false,
        notification: true
    };
    
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];
    
    function loadSettings() {
        pomodoroTimeInput.value = settings.pomodoroTime;
        shortBreakTimeInput.value = settings.shortBreakTime;
        longBreakTimeInput.value = settings.longBreakTime;
        autoStartInput.checked = settings.autoStart;
        notificationInput.checked = settings.notification;
    }
    
    function saveSettings() {
        settings.pomodoroTime = parseInt(pomodoroTimeInput.value) || 25;
        settings.shortBreakTime = parseInt(shortBreakTimeInput.value) || 5;
        settings.longBreakTime = parseInt(longBreakTimeInput.value) || 15;
        settings.autoStart = autoStartInput.checked;
        settings.notification = notificationInput.checked;
        
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        
        if (!isRunning) {
            setTimerForMode(currentMode);
        }
        
        showNotification('Настройки сохранены');
    }
    
    function setTimerForMode(mode) {
        currentMode = mode;
        
        [modePomodoro, modeShortBreak, modeLongBreak].forEach(btn => {
            btn.classList.remove('active');
        });
        
        let minutes;
        let notificationMessage;
        
        switch(mode) {
            case 'pomodoro':
                minutes = settings.pomodoroTime;
                modePomodoro.classList.add('active');
                document.body.style.setProperty('--primary', '#f43f5e');
                document.body.style.setProperty('--primary-light', '#fb7185');
                document.body.style.setProperty('--primary-dark', '#e11d48');
                notificationMessage = 'Время работы истекло! Пора отдохнуть.';
                break;
            case 'shortBreak':
                minutes = settings.shortBreakTime;
                modeShortBreak.classList.add('active');
                document.body.style.setProperty('--primary', '#3b82f6');
                document.body.style.setProperty('--primary-light', '#60a5fa');
                document.body.style.setProperty('--primary-dark', '#2563eb');
                notificationMessage = 'Короткий перерыв закончен! Вернитесь к работе.';
                break;
            case 'longBreak':
                minutes = settings.longBreakTime;
                modeLongBreak.classList.add('active');
                document.body.style.setProperty('--primary', '#10b981');
                document.body.style.setProperty('--primary-light', '#34d399');
                document.body.style.setProperty('--primary-dark', '#059669');
                notificationMessage = 'Длинный перерыв закончен! Вернитесь к работе.';
                break;
        }
        
        secondsLeft = minutes * 60;
        initialSeconds = secondsLeft;
        notificationBox.querySelector('p').textContent = notificationMessage;
        displayTimeLeft();
        updateTimerProgress();
        resetBtn.disabled = true;
    }
    
    function startTimer() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        countdown = setInterval(() => {
            secondsLeft--;
            
            if (secondsLeft <= 0) {
                completeTimer();
            } else {
                displayTimeLeft();
                updateTimerProgress();
            }
        }, 1000);
    }
    
    function pauseTimer() {
        clearInterval(countdown);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function resetTimer() {
        pauseTimer();
        setTimerForMode(currentMode);
        resetBtn.disabled = true;
    }
    
    function completeTimer() {
        clearInterval(countdown);
        isRunning = false;
        
        if (currentMode === 'pomodoro') {
            completedCount++;
            totalMinutes += settings.pomodoroTime;
            
            sessions.unshift({
                mode: 'Работа',
                duration: settings.pomodoroTime,
                date: new Date().toISOString()
            });
            
            if (sessions.length > 50) {
                sessions.pop();
            }
            
            localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
            updateStats();
            updateSessionsHistory();
            
            if (settings.notification) {
                showNotification('Время работы истекло! Пора отдохнуть.');
                playNotificationSound();
            }
            
            if (settings.autoStart) {
                setTimerForMode('shortBreak');
                startTimer();
            } else {
                setTimerForMode('shortBreak');
            }
        } else {
            if (settings.notification) {
                showNotification('Перерыв закончен! Вернитесь к работе.');
                playNotificationSound();
            }
            
            if (settings.autoStart) {
                setTimerForMode('pomodoro');
                startTimer();
            } else {
                setTimerForMode('pomodoro');
            }
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function displayTimeLeft() {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        
        timer.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        document.title = `(${timer.textContent}) Pomodoro Timer`;
    }
    
    function updateTimerProgress() {
        const progressPercent = 100 - ((secondsLeft / initialSeconds) * 100);
        timerProgress.style.background = `conic-gradient(var(--primary) ${progressPercent}%, transparent ${progressPercent}%)`;
    }
    
    function updateStats() {
        completedPomodoros.textContent = completedCount;
        totalTime.textContent = totalMinutes >= 60 ? 
            `${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м` : 
            `${totalMinutes}м`;
    }
    
    function updateSessionsHistory() {
        sessionsHistory.innerHTML = '';
        
        if (sessions.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'История сессий пуста';
            emptyMessage.className = 'empty-history';
            sessionsHistory.appendChild(emptyMessage);
            return;
        }
        
        sessions.slice(0, 5).forEach(session => {
            const item = document.createElement('div');
            item.className = 'session-item';
            
            const date = new Date(session.date);
            const formattedDate = date.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            item.innerHTML = `
                <span>${session.mode}: ${session.duration} мин</span>
                <span>${formattedDate}</span>
            `;
            
            sessionsHistory.appendChild(item);
        });
    }
    
    function showNotification(message) {
        notificationBox.querySelector('p').textContent = message;
        notificationBox.classList.add('show');
        
        setTimeout(() => {
            notificationBox.classList.remove('show');
        }, 3000);
    }
    
    function playNotificationSound() {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch (e) {
            console.error('Не удалось воспроизвести звук уведомления', e);
        }
    }
    
    function loadStats() {
        completedCount = parseInt(localStorage.getItem('completedPomodoros')) || 0;
        totalMinutes = parseInt(localStorage.getItem('totalPomodoroMinutes')) || 0;
        updateStats();
    }
    
    function saveStats() {
        localStorage.setItem('completedPomodoros', completedCount);
        localStorage.setItem('totalPomodoroMinutes', totalMinutes);
    }
    
    modePomodoro.addEventListener('click', () => {
        if (!isRunning) {
            setTimerForMode('pomodoro');
        }
    });
    
    modeShortBreak.addEventListener('click', () => {
        if (!isRunning) {
            setTimerForMode('shortBreak');
        }
    });
    
    modeLongBreak.addEventListener('click', () => {
        if (!isRunning) {
            setTimerForMode('longBreak');
        }
    });
    
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    window.addEventListener('beforeunload', saveStats);
    
    loadSettings();
    loadStats();
    updateSessionsHistory();
    setTimerForMode('pomodoro');
}); 