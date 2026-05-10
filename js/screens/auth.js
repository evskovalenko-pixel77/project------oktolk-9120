window.ScreenAuth = {
  render: function() {
    return `
      <div class="auth-screen">
        <div style="padding: 40px 22px; text-align: center;">
          <div style="width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%); margin: 24px auto 28px; display: flex; align-items: center; justify-content: center; color: white; font-size: 42px; font-family: 'Lora', serif; font-weight: 700; font-style: italic;">П</div>
          
          <h1 style="font-family: 'Lora', serif; font-size: 28px; font-weight: 600; margin-bottom: 12px; letter-spacing: -0.02em;">Помощник</h1>
          
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 32px;">Ваш помощник в бытовых вопросах. Введите номер телефона для начала.</p>

          <div class="form-group">
            <label class="form-label">Номер телефона</label>
            <input type="tel" id="phone-input" class="form-input" placeholder="+7 (999) 123-45-67" maxlength="20">
          </div>

          <div class="form-group">
            <label class="form-label">Имя (опционально)</label>
            <input type="text" id="name-input" class="form-input" placeholder="Ваше имя">
          </div>

          <button id="auth-btn" class="big-action-btn" style="margin-bottom: 12px;">
            <span>✓</span> Начать
          </button>

          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5; padding: 0 8px;">
            Мы используем ваш номер только для проверки и восстановления доступа.
          </div>
        </div>
      </div>
    `;
  },

  init: function() {
    const phoneInput = document.getElementById('phone-input');
    const nameInput = document.getElementById('name-input');
    const authBtn = document.getElementById('auth-btn');

    if (authBtn) {
      authBtn.addEventListener('click', () => {
        const phone = phoneInput.value.trim();
        const name = nameInput.value.trim();

        if (!phone) {
          alert('Пожалуйста, введите номер телефона');
          return;
        }

        const user = PomoshnikDB.createUser(phone, name);
        window.pomoshnikApp.showScreen('home');
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('focus', function() {
        if (!this.value) {
          this.value = '+7 ';
        }
      });
    }
  }
};
