window.ScreenHome = {
  currentConversation: [],

  icons: {
    mic: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
    camera: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    file: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    bot: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`
  },

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
        const icon = isUser ? this.icons.user : this.icons.bot;
        dialogHtml += `
          <div class="message ${isUser ? 'user-message' : 'ai-message'}">
            <div class="message-avatar ${isUser ? 'avatar-user' : 'avatar-bot'}">${icon}</div>
            <div class="message-content">${msg.content}</div>
          </div>
        `;
      });
      dialogHtml += '</div>';
    } else {
      centerContent = `
        <div class="home-hero">
          <div class="home-greeting">${greeting},</div>
          <div class="home-name"><span class="accent">${name}</span></div>
          <div class="home-sub">Задайте вопрос, проверьте документ или сообщение на мошенничество</div>
          <div class="home-chips">
            <button class="home-chip" data-q="Как защититься от мошенников по телефону?">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Антискам
            </button>
            <button class="home-chip" data-q="Объясни этот документ простыми словами: ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Документ
            </button>
            <button class="home-chip" data-q="Дай пошаговую инструкцию: ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Инструкция
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="home-screen">
        ${centerContent}
        ${dialogHtml}
        <div class="composer-wrap">
          <div class="composer">
            <textarea id="text-input" class="composer-input" placeholder="Напишите свой вопрос..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
            <button class="composer-send" id="send-btn">${this.icons.send}</button>
          </div>
          </div><div class="modes">
            <button class="mode" id="voice-input-btn">
              <span class="mode-icon">${this.icons.mic}</span>
              <span class="mode-label">Голос</span>
            </button>
            <button class="mode" id="photo-input-btn">
              <span class="mode-icon">${this.icons.camera}</span>
              <span class="mode-label">Фото</span>
            </button>
            <button class="mode" id="file-input-btn">
              <span class="mode-icon">${this.icons.file}</span>
              <span class="mode-label">Документ</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  addMessage: function(role, content) {
    this.currentConversation.push({ role, content });
  },

  clearConversation: function() {
    this.currentConversation = [];
  },

  init: function() {
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-btn');

    const submit = () => {
      if (textInput && textInput.value.trim()) {
        ScreenHome.submitText(textInput.value.trim());
        textInput.value = '';
        textInput.style.height = 'auto';
      }
    };

    if (textInput) {
      textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      });
    }
    if (sendBtn) sendBtn.addEventListener('click', submit);

    const voiceBtn = document.getElementById('voice-input-btn');
    const photoBtn = document.getElementById('photo-input-btn');
    const fileBtn = document.getElementById('file-input-btn');

    if (voiceBtn) voiceBtn.addEventListener('click', () => window.pomoshnikApp.startVoiceInput());
    if (photoBtn) photoBtn.addEventListener('click', () => window.pomoshnikApp.startPhotoInput());
    if (fileBtn) fileBtn.addEventListener('click', () => window.pomoshnikApp.startFileInput());

    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        if (textInput) {
          textInput.value = btn.dataset.q;
          textInput.focus();
        }
      });
    });
  },

  submitText: async function(text) {
    this.addMessage('user', text);
    window.pomoshnikApp.showHome();
    try {
      const result = await window.PomoshnikAPI.processInput(text);
      this.addMessage('ai', result.reply);
      window.pomoshnikApp.showHome();
    } catch (error) {
      this.addMessage('ai', 'Ошибка обработки запроса. Попробуйте снова.');
      window.pomoshnikApp.showHome();
    }
  }
};
