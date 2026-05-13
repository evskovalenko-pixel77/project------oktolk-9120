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
            Учёт расходов по категориям: аптека, магазин, коммуналка, кредиты.<br><br>
            Голосом или текстом: «Потратил 500 рублей в аптеке» — AI сам внесёт в нужную категорию.
          </div>
        </div>

        <div class="finance-voice-hint">
          <div class="finance-voice-hint-icon">🎤</div>
          <div class="finance-voice-hint-text">
            <strong>Как будет работать:</strong> скажите или напишите расход — AI распознает категорию и запишет автоматически
          </div>
        </div>
      </div>
    `;
  },

  init: function() {}
};
