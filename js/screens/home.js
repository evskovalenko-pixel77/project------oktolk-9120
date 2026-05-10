window.ScreenHome = {
  currentConversation: [],

  render: function() {
    const user = PomoshnikDB.getCurrentUser();
    const greeting = PomoshnikUtils.getGreeting();
    const name = user && user.name ? user.name : 'Гость';

    let dialogHtml = '';
    let centerContent = '';
    
    if (this.currentConversation.length > 0) {
      dialogHtml = '<div class="dialog-window">';
      this.currentConversation.forEach(msg => {
        const isUser = msg.role === 'user';
        dialogHtml += `
          <div class="message ${isUser ? 'user-message' : 'ai-message'}">
            <div class="message-content">${msg.content}</div>
          </div>
        `;
      });
      dialogHtml += '</div>';
    } else {
      centerContent = `
        <div class="center-content">
          <div class="greeting">${greeting}, <span class="accent">${name}</span>!</div>
          <div class="description">
            <p>Вы можете задать свой вопрос голосом, сфотографировать или приложить файл.</p>
            <p><strong>Я помогу вам.</strong></p>
          </div>
        </div>
      `;
    }

    return `
      <div class="home-screen new-layout">
        <div class="page-top">
          <div class="logo-mark">
            <div class="logo-circle">О</div>
            <div class="logo-text">OkTolk</div>
          </div>
          <div class="icon-btn" id="notif-btn" title="Уведомления">
            🔔
          </div>
        </div>

        ${centerContent}
        ${dialogHtml}

        <div class="input-section">
          <div class="input-row">
            <input type="text" id="text-input" class="text-input" placeholder="Напишите свой вопрос..." />
            <button class="send-btn" id="send-btn" title="Отправить">➤</button>
          </div>
          
          <div class="input-buttons">
            <button class="input-btn voice-btn" id="voice-input-btn" title="Диктовать">
              <span class="btn-icon">🎤</span>
              <span class="btn-label">Голос</span>
            </button>
            <button class="input-btn photo-btn" id="photo-input-btn" title="Фото">
              <span class="btn-icon">📸</span>
              <span class="btn-label">Фото</span>
            </button>
            <button class="input-btn file-btn" id="file-input-btn" title="Документ">
              <span class="btn-icon">📄</span>
              <span class="btn-label">Документ</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  addMessage: function(role, content) {
    this.currentConversation.push({ role: role, content: content });
  },

  clearConversation: function() {
    this.currentConversation = [];
  },

  init: function() {
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const photoInputBtn = document.getElementById('photo-input-btn');
    const fileInputBtn = document.getElementById('file-input-btn');

    if (textInput) {
      textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && textInput.value.trim()) {
          ScreenHome.submitText(textInput.value.trim());
          textInput.value = '';
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (textInput && textInput.value.trim()) {
          ScreenHome.submitText(textInput.value.trim());
          textInput.value = '';
        }
      });
    }

    if (voiceInputBtn) {
      voiceInputBtn.addEventListener('click', () => {
        window.pomoshnikApp.startVoiceInput();
      });
    }

    if (photoInputBtn) {
      photoInputBtn.addEventListener('click', () => {
        window.pomoshnikApp.startPhotoInput();
      });
    }

    if (fileInputBtn) {
      fileInputBtn.addEventListener('click', () => {
        window.pomoshnikApp.startFileInput();
      });
    }
  },

  submitText: async function(text) {
    this.addMessage('user', text);
    this.render();
    window.pomoshnikApp.showHome();

    try {
      const result = await window.PomoshnikAPI.processInput(text);
      this.addMessage('ai', result.analysis);
      window.pomoshnikApp.showHome();
    } catch (error) {
      console.error('Error processing text:', error);
      this.addMessage('ai', '❌ Ошибка обработки запроса');
      window.pomoshnikApp.showHome();
    }
  }
};

