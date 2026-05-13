window.ScreenFinance = {
  render: function() {
    return `
      <div class="finance-screen">
        <div class="finance-header">
          <div class="finance-header-title">Мои финансы</div>
          <div class="finance-balance-label">Расходы за май 2026</div>
          <div class="finance-balance">0 ₽</div>
          <div class="finance-row">
            <div class="finance-badge">
              <div class="finance-badge-label">Доход</div>
              <div class="finance-badge-val">— ₽</div>
            </div>
            <div class="finance-badge">
              <div class="finance-badge-label">Остаток</div>
              <div class="finance-badge-val">— ₽</div>
            </div>
          </div>
        </div>

        <div class="finance-coming-soon">
          <div class="finance-coming-soon-icon">💳</div>
          <div class="finance-coming-soon-title">Скоро появится</div>
          <div class="finance-coming-soon-text">
            Учёт расходов: аптека, магазин, коммуналка, кредиты.<br>
            Разбор кредитов и платежей. Мониторинг бюджета.
          </div>
        </div>

        <div class="section-ai-chat">
          <div class="section-ai-title">Спросите AI о финансах</div>
          <div class="section-ai-examples">
            <button class="ai-example-btn" data-q="Как сэкономить на коммунальных платежах?">💡 Как сэкономить на ЖКХ?</button>
            <button class="ai-example-btn" data-q="Объясни что такое рефинансирование кредита простыми словами">🏦 Что такое рефинансирование?</button>
            <button class="ai-example-btn" data-q="Как составить семейный бюджет на месяц?">📊 Как составить бюджет?</button>
          </div>
          <div class="section-ai-input-wrap">
            <textarea class="section-ai-input" id="finance-ai-input" placeholder="Задайте вопрос о финансах..." rows="1"></textarea>
            <button class="section-ai-send" id="finance-ai-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div id="finance-ai-response" class="section-ai-response" style="display:none;"></div>
        </div>
      </div>
    `;
  },

  init: function() {
    const sendBtn = document.getElementById('finance-ai-send');
    const input = document.getElementById('finance-ai-input');
    const response = document.getElementById('finance-ai-response');

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
