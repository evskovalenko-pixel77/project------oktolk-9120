window.ScreenProfile = {
  render: function() {
    const user = PomoshnikDB.getCurrentUser();
    const contacts = PomoshnikDB.getTrustedContacts();

    let contactsHtml = '';
    if (contacts && contacts.length > 0) {
      contacts.forEach(contact => {
        contactsHtml += `
          <div class="contact-card">
            <div>
              <div class="contact-name">${contact.name}</div>
              <div class="contact-role">${contact.role}</div>
              ${contact.phone ? '<div class="contact-phone">📞 ' + contact.phone + '</div>' : ''}
              ${contact.telegram ? '<div class="contact-phone">💬 ' + contact.telegram + '</div>' : ''}
            </div>
            <button class="contact-remove remove-contact-btn" data-contact-id="${contact.id}">✕</button>
          </div>
        `;
      });
    }

    return `
      <div class="profile-screen">
        <div style="background: var(--green); padding: 24px 24px 28px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.4);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 900; color: white;">${user ? (user.name || 'Пользователь') : 'Гость'}</div>
            <div style="font-size: 16px; color: rgba(255,255,255,0.8); margin-top: 4px; font-weight: 600;">${user ? (user.phone || '') : ''}</div>
          </div>
        </div>

        <div style="padding: 24px; display: flex; flex-direction: column; gap: 12px;">

          <div style="font-size: 20px; font-weight: 900; color: var(--text); margin: 4px 0;">Настройки</div>

          <div style="background: white; border-radius: 20px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; border: 2px solid var(--border);">
            <div>
              <div style="font-size: 17px; font-weight: 800;">Размер шрифта</div>
              <div style="font-size: 14px; color: var(--text-soft); margin-top: 3px; font-weight: 600;">Для удобства чтения</div>
            </div>
            <select id="font-size-select" style="background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; padding: 12px 16px; font-family: Nunito, sans-serif; font-size: 15px; font-weight: 700; outline: none; cursor: pointer;">
              <option value="small">Маленький</option>
              <option value="normal" selected>Обычный</option>
              <option value="large">Большой</option>
            </select>
          </div>

          <div style="background: white; border-radius: 20px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; border: 2px solid var(--border);">
            <div>
              <div style="font-size: 17px; font-weight: 800;">Тема оформления</div>
              <div style="font-size: 14px; color: var(--text-soft); margin-top: 3px; font-weight: 600;">Светлая или тёмная</div>
            </div>
            <select id="theme-select" style="background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; padding: 12px 16px; font-family: Nunito, sans-serif; font-size: 15px; font-weight: 700; outline: none; cursor: pointer;">
              <option value="light" selected>☀️ День</option>
              <option value="dark">🌙 Ночь</option>
            </select>
          </div>

          <div style="font-size: 20px; font-weight: 900; margin: 8px 0 4px;">Доверенные лица</div>
          <div style="font-size: 16px; color: var(--text-mid); line-height: 1.5; font-weight: 600;">Добавьте контакты близких. Когда возникает проблема, я могу отправить им описание ситуации.</div>

          ${contactsHtml}

          <button id="add-contact-btn" style="width: 100%; padding: 18px; background: #E8F5EE; border: 2px dashed #2A7D4F; border-radius: 20px; font-family: Nunito, sans-serif; font-size: 17px; font-weight: 800; color: #1A5C38; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            + Добавить доверенное лицо
          </button>

          <button id="logout-btn" style="width: 100%; padding: 18px; background: transparent; border: 2px solid #D32F2F; border-radius: 20px; font-family: Nunito, sans-serif; font-size: 17px; font-weight: 800; color: #D32F2F; cursor: pointer; margin-top: 8px;">
            Выйти
          </button>

        </div>
      </div>

      <div id="contact-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 28px; padding: 28px 24px 32px; width: 90%; max-width: 420px;">
          <div style="font-size: 22px; font-weight: 900; margin-bottom: 24px; text-align: center;">Добавить доверенное лицо</div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 14px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Имя *</label>
              <input id="modal-name" type="text" placeholder="Например: Сын, Дочь, Внук" style="width: 100%; padding: 16px 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 18px; font-weight: 600; outline: none;">
            </div>
            <div>
              <label style="font-size: 14px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Роль *</label>
              <input id="modal-role" type="text" placeholder="Например: Сын" style="width: 100%; padding: 16px 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 18px; font-weight: 600; outline: none;">
            </div>
            <div>
              <label style="font-size: 14px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Телефон</label>
              <input id="modal-phone" type="tel" placeholder="+7 900 000 00 00" style="width: 100%; padding: 16px 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 18px; font-weight: 600; outline: none;">
            </div>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button id="modal-cancel" style="flex: 1; padding: 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 17px; font-weight: 800; color: #777; cursor: pointer;">Отмена</button>
            <button id="modal-save" style="flex: 2; padding: 18px; background: #2A7D4F; border: none; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 17px; font-weight: 800; color: white; cursor: pointer;">Сохранить</button>
          </div>
        </div>
      </div>
    `;
  },

  showModal: function() {
    const modal = document.getElementById('contact-modal');
    if (modal) { modal.style.display = 'flex'; document.getElementById('modal-name').focus(); }
  },

  hideModal: function() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
      modal.style.display = 'none';
      document.getElementById('modal-name').value = '';
      document.getElementById('modal-role').value = '';
      document.getElementById('modal-phone').value = '';
    }
  },

  init: function() {
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', (e) => {
        const sizes = { small: '15px', normal: '18px', large: '21px' };
        document.documentElement.style.fontSize = sizes[e.target.value];
      });
    }

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        document.body.style.filter = e.target.value === 'dark' ? 'invert(1) hue-rotate(180deg)' : '';
      });
    }

    const addContactBtn = document.getElementById('add-contact-btn');
    if (addContactBtn) { addContactBtn.addEventListener('click', () => this.showModal()); }

    const modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) { modalCancel.addEventListener('click', () => this.hideModal()); }

    const modal = document.getElementById('contact-modal');
    if (modal) { modal.addEventListener('click', (e) => { if (e.target === modal) this.hideModal(); }); }

    const modalSave = document.getElementById('modal-save');
    if (modalSave) {
      modalSave.addEventListener('click', () => {
        const name = document.getElementById('modal-name').value.trim();
        const role = document.getElementById('modal-role').value.trim();
        const phone = document.getElementById('modal-phone').value.trim();
        if (!name) { document.getElementById('modal-name').style.borderColor = '#D32F2F'; return; }
        if (!role) { document.getElementById('modal-role').style.borderColor = '#D32F2F'; return; }
        PomoshnikDB.addTrustedContact(name, role, phone, '');
        this.hideModal();
        window.pomoshnikApp.showScreen('profile');
      });
    }

    const removeContactBtns = document.querySelectorAll('.remove-contact-btn');
    removeContactBtns.forEach(btn => {
      btn.addEventListener('click', () => {
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
