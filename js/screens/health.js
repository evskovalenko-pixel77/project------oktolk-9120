window.ScreenHealth = {
  render: function() {
    return `
      <div class="health-screen">
        <div class="health-header">
          <div class="health-header-title">Моё здоровье</div>
          <div class="health-header-sub">Контроль показателей и лекарств</div>
        </div>

        <div class="health-coming-soon">
          <div class="health-coming-soon-icon">❤️</div>
          <div class="health-coming-soon-title">Скоро появится</div>
          <div class="health-coming-soon-text">
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
