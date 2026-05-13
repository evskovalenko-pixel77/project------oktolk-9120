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
            Контроль давления, пульса и сахара. Напоминания о лекарствах. Разбор инструкций к препаратам.<br><br>
            Доступно в тарифе <strong>Про</strong> — 399 ₽/мес.
          </div>
        </div>

        <div class="health-stats" style="opacity:0.4; pointer-events:none;">
          <div class="health-stat-card">
            <div class="health-stat-label">Давление</div>
            <div class="health-stat-value">—/—</div>
            <div class="health-stat-unit">мм рт.ст.</div>
            <div class="health-stat-badge ok">Нет данных</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-label">Пульс</div>
            <div class="health-stat-value">—</div>
            <div class="health-stat-unit">уд/мин</div>
            <div class="health-stat-badge ok">Нет данных</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-label">Сахар</div>
            <div class="health-stat-value">—</div>
            <div class="health-stat-unit">ммоль/л</div>
            <div class="health-stat-badge ok">Нет данных</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-label">Самочувствие</div>
            <div class="health-stat-value" style="font-size:16px; margin-top:4px;">Нет записей</div>
            <div class="health-stat-badge ok">Сегодня</div>
          </div>
        </div>
      </div>
    `;
  },

  init: function() {}
};
