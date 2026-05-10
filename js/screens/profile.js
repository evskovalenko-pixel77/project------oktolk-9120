window.ScreenProfile = {
  render: function() {
    const user = PomoshnikDB.getCurrentUser();
    const contacts = PomoshnikDB.getTrustedContacts();

    let contactsHtml = '';
    if (contacts && contacts.length > 0) {
      contacts.forEach(contact => {
        contactsHtml += `
          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; margin-bottom: 2px;">${contact.name}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${contact.role}</div>
              ${contact.phone ? '<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">☎️ ' + contact.phone + '</div>' : ''}
              ${contact.telegram ? '<div style="font-size: 12px; color: var(--text-muted);">💬 ' + contact.telegram + '</div>' : ''}
            </div>
            <button class="remove-contact-btn" data-contact-id="${contact.id}" style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer;">✕</button>
          </div>
        `;
      });
    }

    return `
      <div class="profile-screen">
        <div style="padding: 20px 20px 16px;">
          <h2 style="font-family: 'Lora', serif; font-size: 28px; font-weight: 600; margin-bottom: 6px;">Мой <em style="font-style: italic; color: var(--accent);">профиль</em></h2>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin: 0 20px 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">👤</div>
            <div>
              <div style="font-weight: 700; font-size: 18px;">${user ? (user.name || 'Пользователь') : 'Гость'}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${user ? (user.phone || '') : ''}</div>
            </div>
          </div>
        </div>

        <div style="padding: 0 20px;">
          <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Настройки</h3>

          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; margin-bottom: 2px;">Размер шрифта</div>
              <div style="font-size: 13px; color: var(--text-muted);">Для удобства чтения</div>
            </div>
            <select id="font-size-select" style="background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-family: inherit; color: var(--text-primary);">
              <option value="small">Маленький</option>
              <option value="normal" selected>Нормальный</option>
              <option value="large">Большой</option>
            </select>
          </div>

          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; margin-bottom: 2px;">Тёмная тема</div>
              <div style="font-size: 13px; color: var(--text-muted);">Для глаз ночью</div>
            </div>
            <input type="checkbox" id="dark-mode-toggle" style="width: 40px; height: 24px; cursor: pointer;">
          </div>

          <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Доверенные лица</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 14px;">Добавьте контакты близких. Когда возникает проблема, я могу отправить им описание ситуации.</p>

          ${contactsHtml}

          <button id="add-contact-btn" style="width: 100%; padding: 14px; background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent-dark); border-radius: 12px; font-family: inherit; font-weight: 700; font-size: 15px; cursor: pointer; margin-bottom: 24px;">
            + Добавить доверенное лицо
          </button>

          <button id="logout-btn" style="width: 100%; padding: 14px; background: transparent; border: 1px solid var(--danger); color: var(--danger); border-radius: 12px; font-family: inherit; font-weight: 700; cursor: pointer; margin-bottom: 24px;">
            Выйти
          </button>
        </div>
      </div>
    `;
  },

  init: function() {
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', (e) => {
        const sizes = { small: '14px', normal: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizes[e.target.value];
      });
    }

    const addContactBtn = document.getElementById('add-contact-btn');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => {
        const name = prompt('Имя (например, Сын, Дочь, Внук):');
        if (!name) return;
        const role = prompt('Роль (например, Сын):');
        if (!role) return;
        const phone = prompt('Номер телефона (опционально):');
        const telegram = prompt('Telegram (опционально):');
        PomoshnikDB.addTrustedContact(name, role, phone || '', telegram || '');
        window.pomoshnikApp.showScreen('profile');
      });
    }

    const removeContactBtns = document.querySelectorAll('.remove-contact-btn');
    removeContactBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Удалить этот контакт?')) {
          PomoshnikDB.removeTrustedContact(btn.dataset.contactId);
          window.pomoshnikApp.showScreen('profile');
        }
      });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
          PomoshnikDB.clearCurrentUser();
          window.pomoshnikApp.showScreen('auth');
        }
      });
    }
  }
};
