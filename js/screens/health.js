window.ScreenHealth = {
  render: function() {
    return `
      <div class="health-screen">
        <div class="hero heart" style="margin:14px 18px 0;">
          <div class="hero-eyebrow">МОЁ ЗДОРОВЬЕ</div><div class="hero-title">Контроль показателей</div>
          <div class="hero-sub">и лекарств</div>
        </div>

        <div class="placeholder" style="margin-top:14px;">
          <div class="placeholder-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <div class="placeholder-title">Скоро появится</div>
          <div class="placeholder-text">
            Контроль давления, пульса и сахара. Графики динамики.<br>
            Напоминания о лекарствах в Telegram и push.<br>
            Доступно в тарифе <strong>Про</strong> — 399 ₽/мес.
          </div>
        </div>

        <div class="section-ai-chat">
          <div class="section-ai-title">Спросите AI о здоровье</div>
          <div class="section-ai-examples">
            <button class="ai-example-btn" data-q="Расскажи о препарате Эналаприл: для чего, как принимать, побочные эффекты">💊 Разбор лекарства</button>
            <button class="ai-example-btn" data-q="Что значит давление 140 на 90? Это опасно?">🩺 Что значит давление 140/90?</button>
            <button class="ai-example-btn" data-q="Какие продукты снижают давление?">🥗 Что снижает давление?</button>
          </div>
          <div class="section-ai-input-wrap">
            <textarea class="section-ai-input" id="health-ai-input" placeholder="Спросите о лекарстве, диагнозе или симптомах..." rows="1"></textarea>
            <button class="section-ai-send" id="health-ai-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div id="health-ai-response" class="section-ai-response" style="display:none;"></div>
        </div>
      </div>
    `;
  },

  init: function() {
    const sendBtn = document.getElementById('health-ai-send');
    const input = document.getElementById('health-ai-input');
    const response = document.getElementById('health-ai-response');

    const sendMessage = async () => {
      const q = input.value.trim();
      if (!q) return;
      response.style.display = 'block';
      response.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      input.value = '';
      try {
        const result = await fetch('/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message: q, history: []})
        });
        const data = await result.json();
        response.innerHTML = `<div class="section-ai-answer">${data.reply}</div>`;
      } catch(e) {
        response.innerHTML = '<div class="section-ai-answer">Ошибка соединения. Попробуйте снова.</div>';
      }
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    }

    document.querySelectorAll('.ai-example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (input) { input.value = btn.dataset.q; sendMessage(); }
      });
    });
  }
};
