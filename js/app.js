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
    this.setupHeader();
  },

  setupHeader: function() {
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.showScreen('profile');
      });
    }

    const notifBtn = document.getElementById('notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        // TODO: показать уведомления
      });
    }
  },

  setupNavigation: function() {
    const navBar = document.getElementById('nav-bar');
    if (!navBar) return;

    const navBtns = navBar.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        this.showScreen(screen);
      });
    });

    const navOk = document.getElementById('nav-ok');
    if (navOk) {
      navOk.addEventListener('click', () => {
        this.showScreen('home');
      });
    }
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
      case 'finance':
        screenModule = window.ScreenFinance;
        html = window.ScreenFinance ? window.ScreenFinance.render() : '<div style="padding:40px 20px;text-align:center;color:#888;font-size:16px;font-weight:700;">Загрузка...</div>';
        break;
      case 'health':
        screenModule = window.ScreenHealth;
        html = window.ScreenHealth ? window.ScreenHealth.render() : '<div style="padding:40px 20px;text-align:center;color:#888;font-size:16px;font-weight:700;">Загрузка...</div>';
        break;
    }

    if (content) {
      content.innerHTML = html;
    }

    if (screenModule && screenModule.init) {
      setTimeout(() => screenModule.init(), 0);
    }

    this.updateNavigationState(screenName);
  },

  showHome: function() {
    this.showScreen('home');
  },

  showAnswerScreen: function(analysis) {
    const content = document.getElementById('content');
    const html = ScreenAnswer.render(analysis);
    if (content) content.innerHTML = html;
    setTimeout(() => ScreenAnswer.init(), 0);
  },

  updateNavigationState: function(screenName) {
    const navBar = document.getElementById('nav-bar');
    if (!navBar) return;

    const navBtns = navBar.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenName);
    });

    const navOk = document.getElementById('nav-ok');
    if (navOk) {
      navOk.classList.toggle('active', screenName === 'home');
    }

    // Скрываем хедер на экране авторизации
    const header = document.querySelector('.app-header');
    if (header) {
      header.style.display = screenName === 'auth' ? 'none' : 'flex';
    }
  },

  startVoiceInput: async function() {
    const textInput = document.getElementById('text-input');
    const voiceBtn = document.getElementById('voice-input-btn');
    if (!textInput || !voiceBtn) return;
    voiceBtn.style.opacity = '0.5';
    voiceBtn.style.pointerEvents = 'none';
    voiceBtn.classList.add('recording');
    voiceBtn.innerHTML = '<span class="btn-icon" style="animation: pulse 1s infinite;">🎤</span><span class="btn-label">Слушаю...</span>';

    PomoshnikMultimedia.startRealtimeVoiceRecognition(
      (transcript) => { textInput.value = transcript; },
      (error) => { console.error('Voice error:', error); },
      (finalTranscript) => {
        if (finalTranscript) {
          textInput.value = finalTranscript;
          setTimeout(() => { ScreenHome.submitText(finalTranscript); textInput.value = ''; }, 100);
        }
        voiceBtn.style.opacity = '1';
        voiceBtn.style.pointerEvents = 'auto';
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<span class="btn-icon">🎤</span><span class="btn-label">Голос</span>';
      }
    );
  },

  startPhotoInput: async function() {
    const result = await PomoshnikMultimedia.capturePhoto();
    if (!result.success) { alert('Ошибка доступа к камере: ' + result.error); return; }
    this.currentInputType = 'image';
    this.currentInputData = result.data;
    const content = document.getElementById('content');
    content.innerHTML = `
      <div style="padding: 20px 22px;">
        <div class="screen-header">
          <button class="back-btn" id="back-btn">←</button>
          <div class="screen-title">Фото</div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 12px; margin-bottom: 18px;">
          <img src="${result.data}" style="width: 100%; border-radius: 12px; display: block;">
        </div>
        <button id="process-photo-btn" class="big-action-btn" style="margin-bottom: 12px;">📤 Отправить на анализ</button>
        <button class="big-action-btn" style="background: transparent; color: var(--green); border: 2px solid var(--green); box-shadow: none;" id="re-photo-btn">📸 Новое фото</button>
      </div>
    `;
    document.getElementById('back-btn').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('process-photo-btn').addEventListener('click', () => this.processInput());
    document.getElementById('re-photo-btn').addEventListener('click', () => this.startPhotoInput());
  },

  processInput: async function() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Анализирую...</div>
      </div>
    `;
    const result = await PomoshnikAPI.processInput(this.currentInputType, this.currentInputData);
    if (result.success) {
      PomoshnikDB.addHistory(this.currentInputType, this.currentInputData, result.analysis);
      this.showAnswerScreen(result);
    } else {
      content.innerHTML = `<div class="error-msg">Ошибка при обработке запроса: ${result.error}</div>`;
    }
  },

  showSubscriptionScreen: function() {
    console.log('subscription screen - coming soon');
  },

  showHistoryItem: function(historyId) {
    const history = PomoshnikDB.getHistory();
    const item = history.find(h => h.id === historyId);
    if (item) {
      this.showAnswerScreen({ analysis: item.output, riskLevel: 0, flags: [], recommendations: [] });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.pomoshnikApp.init();
});

const style = document.createElement('style');
style.textContent = `@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }`;
document.head.appendChild(style);
