window.pomoshnikApp = {
  currentScreen: 'home',
  currentInputType: null,
  currentInputData: null,

  init: function() {
    
    
    const user = PomoshnikDB.getCurrentUser();
    if (!user) {
      this.showScreen('auth');
    } else {
      this.showScreen('home');
    }

    this.setupNavigation();
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  },

  setupNavigation: function() {
    const navBar = document.getElementById('nav-bar');
    if (!navBar) return;

    const navBtns = navBar.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screen = btn.dataset.screen;
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.showScreen(screen);
      });
    });
  },

  showScreen: function(screenName) {
    const user = PomoshnikDB.getCurrentUser();
    
    if (screenName !== 'auth' && !user) {
      this.showScreen('auth');
      return;
    }

    this.currentScreen = screenName;
    const content = document.getElementById('content');
    let html = '';
    let screenModule = null;

    switch(screenName) {
      case 'auth':
        screenModule = ScreenAuth;
        html = ScreenAuth.render();
        break;
      case 'home':
        screenModule = ScreenHome;
        html = ScreenHome.render();
        break;
      case 'news':
        screenModule = ScreenNews;
        html = ScreenNews.render();
        break;
      case 'sites':
        screenModule = ScreenSites;
        html = ScreenSites.render();
        break;
      case 'profile':
        screenModule = ScreenProfile;
        html = ScreenProfile.render();
        break;
    }

    if (content) {
      content.innerHTML = html;
    }

    if (screenModule && screenModule.init) {
      setTimeout(() => {
        screenModule.init();
      }, 0);
    }

     this.updateNavigationState(screenName);
   },

   showHome: function() {
     this.showScreen('home');
   },

   showAnswerScreen: function(analysis) {
    const content = document.getElementById('content');
    const html = ScreenAnswer.render(analysis);
    
    if (content) {
      content.innerHTML = html;
    }

    setTimeout(() => {
      ScreenAnswer.init();
    }, 0);
  },

  updateNavigationState: function(screenName) {
    const navBar = document.getElementById('nav-bar');
    if (!navBar) return;

    const navBtns = navBar.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      if (btn.dataset.screen === screenName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  startVoiceInput: async function() {
    const textInput = document.getElementById('text-input');
    const voiceBtn = document.getElementById('voice-input-btn');
    
    if (!textInput || !voiceBtn) return;

    // Отключаем кнопку во время записи
    voiceBtn.style.opacity = '0.5';
    voiceBtn.style.pointerEvents = 'none';
    voiceBtn.classList.add('recording');

    // Добавляем визуальный индикатор
    voiceBtn.innerHTML = '<span class="btn-icon" style="animation: pulse 1s infinite;">🎤</span><span class="btn-label">Слушаю...</span>';

    PomoshnikMultimedia.startRealtimeVoiceRecognition(
      (transcript) => {
        textInput.value = transcript;
      },
      (error) => {
        console.error('Voice error:', error);
      },
      (finalTranscript) => {
        if (finalTranscript) {
          textInput.value = finalTranscript;
          // Автоматически отправляем через 100ms
          setTimeout(() => {
            ScreenHome.submitText(finalTranscript);
            textInput.value = '';
          }, 100);
        }
        // Восстанавливаем кнопку
        voiceBtn.style.opacity = '1';
        voiceBtn.style.pointerEvents = 'auto';
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<span class="btn-icon">🎤</span><span class="btn-label">Голос</span>';
      }
    );
  },

  showVoiceRecordingUI: function() {
    const content = document.getElementById('content');
    const html = `
      <div style="padding: 40px 22px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="width: 100px; height: 100px; margin-bottom: 24px; background: var(--accent); border-radius: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 50px; animation: pulse 1s infinite;">
            🎤
          </div>
          <h2 style="font-family: 'Lora', serif; font-size: 24px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.02em;">Слушаю вас</h2>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; text-align: center;">Говорите свободно, текст появится ниже</p>
          
          <div style="background: var(--bg-soft); border-radius: 12px; padding: 16px; width: 100%; margin-bottom: 20px; min-height: 60px; max-height: 100px; overflow-y: auto;">
            <input 
              id="realtime-voice-input" 
              type="text" 
              placeholder="Текст появится здесь..." 
              style="width: 100%; border: none; background: transparent; font-size: 14px; font-family: 'Manrope', sans-serif; resize: none; outline: none; color: var(--text);"
              readonly
            />
          </div>
        </div>
        
        <button id="stop-recording-btn" class="big-action-btn">
          ⏹️ Закончить запись
        </button>
      </div>
    `;

    if (content) {
      content.innerHTML = html;
    }

    const stopBtn = document.getElementById('stop-recording-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', async () => {
        PomoshnikMultimedia.stopRealtimeVoiceRecognition();
        this.showHome();
      });
    }
  },

  stopVoiceInput: async function() {
    PomoshnikMultimedia.stopRealtimeVoiceRecognition();
  },

  onVoiceRecorded: function() {
    // Legacy function - no longer used with realtime voice recognition
  },

  startPhotoInput: async function() {
    const result = await PomoshnikMultimedia.capturePhoto();
    
    if (!result.success) {
      alert('Ошибка доступа к камере: ' + result.error);
      return;
    }

    this.currentInputType = 'image';
    this.currentInputData = result.data;

    const content = document.getElementById('content');
    const html = `
      <div style="padding: 20px 22px;">
        <div class="screen-header">
          <button class="back-btn" id="back-btn">←</button>
          <div class="screen-title">Фото</div>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 12px; margin-bottom: 18px; overflow: hidden;">
          <img src="${result.data}" style="width: 100%; border-radius: 12px; display: block;">
        </div>

        <button id="process-photo-btn" class="big-action-btn" style="margin-bottom: 12px;">
          📤 Отправить на анализ
        </button>

        <button class="big-action-btn" style="background: transparent; color: var(--accent); border: 2px solid var(--accent); box-shadow: none;" id="re-photo-btn">
          📸 Новое фото
        </button>
      </div>
    `;

    if (content) {
      content.innerHTML = html;
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    const processBtn = document.getElementById('process-photo-btn');
    if (processBtn) {
      processBtn.addEventListener('click', async () => {
        await this.processInput();
      });
    }

    const rePhotoBtn = document.getElementById('re-photo-btn');
    if (rePhotoBtn) {
      rePhotoBtn.addEventListener('click', () => {
        this.startPhotoInput();
      });
    }
  },

  startTextInput: function() {
    console.log('📝 startTextInput вызвана');
    const content = document.getElementById('content');
    const html = `
      <div style="padding: 20px 22px;">
        <div class="screen-header">
          <button class="back-btn" id="back-btn">←</button>
          <div class="screen-title">Описать</div>
        </div>

        <form id="text-input-form">
          <div class="form-group">
            <label class="form-label">Опишите вашу проблему</label>
            <textarea id="text-area" class="form-input" style="resize: vertical; min-height: 120px; padding: 14px 16px; font-family: inherit; font-size: 16px;" placeholder="Например: мне пришло письмо от &quot;Госуслуг&quot; с просьбой подтвердить данные..."></textarea>
          </div>

          <button type="submit" class="big-action-btn" style="margin-bottom: 12px;">
            ✓ Отправить
          </button>

          <button type="button" class="big-action-btn" style="background: transparent; color: var(--accent); border: 2px solid var(--accent); box-shadow: none;" id="cancel-btn">
            Отмена
          </button>
        </form>
      </div>
    `;

    if (content) {
      content.innerHTML = html;
    }

    const form = document.getElementById('text-input-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textArea = document.getElementById('text-area');
        const text = textArea.value.trim();
        
        if (!text) {
          alert('Пожалуйста, опишите вашу проблему');
          return;
        }

        this.currentInputType = 'text';
        this.currentInputData = text;
        await this.processInput();
      });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    setTimeout(() => {
      document.getElementById('text-area').focus();
    }, 100);
  },

   processInput: async function() {
     const user = PomoshnikDB.getCurrentUser();

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div style="margin-top: 20px; text-align: center;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Анализирую...</div>
          <div style="font-size: 14px; color: var(--text-muted);">Это займет всего несколько секунд</div>
        </div>
      </div>
    `;

     //     PomoshnikDB.incrementRequestCount();

    const result = await PomoshnikAPI.processInput(this.currentInputType, this.currentInputData);

    if (result.success) {
      PomoshnikDB.addHistory(this.currentInputType, this.currentInputData, result.analysis);
      this.showAnswerScreen(result);
    } else {
      content.innerHTML = `
        <div class="error-msg">
          Ошибка при обработке запроса: ${result.error}
        </div>
      `;
    }
  },

  sendToContact: async function(contact, analysis) {
    const messageText = `
Проблема: ${analysis.analysis}

Рекомендации:
${analysis.recommendations.map(r => '• ' + r).join('\n')}

---
⚠️ Это сообщение создано приложением \"Помощник\" автоматически. Если оно содержит просьбу о деньгах или переводе - это мошенничество. Позвоните маме по обычному номеру.
    `;

    const result = await PomoshnikMultimedia.shareMessage(
      'Результат анализа от Помощника',
      messageText,
      contact.phone || contact.telegram || ''
    );

    if (result.success) {
      alert(`✓ Сообщение отправлено ${contact.name}`);
    } else {
      alert('Ошибка отправки: ' + result.error);
    }
  },

  showSubscriptionScreen: function() {
     console.log('showSubscriptionScreen отключена - функция оплаты выключена для тестирования');
   },

  showHistoryItem: function(historyId) {
    const history = PomoshnikDB.getHistory();
    const item = history.find(h => h.id === historyId);
    if (item) {
      this.showAnswerScreen({
        analysis: item.output,
        riskLevel: 0,
        flags: [],
        recommendations: []
      });
    }
  },

  updateTime: function() {
    const now = new Date();
    const time = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + 
                 (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    const timeEl = document.querySelector('.time');
    if (timeEl) {
      timeEl.textContent = time;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.pomoshnikApp.init();
});

const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;
document.head.appendChild(style);
