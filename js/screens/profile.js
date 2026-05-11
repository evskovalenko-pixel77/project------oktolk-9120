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
        <div class="profile-header">
          <div class="profile-avatar">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div class="profile-name">${user ? (user.name || 'Пользователь') : 'Гость'}</div>
            <div class="profile-phone">${user ? (user.phone || '') : ''}</div>
          </div>
        </div>

        <div style="padding: 20px; display: flex; flex-direction: column; gap: 10px;">

          <div class="profile-section-title">Настройки</div>

          <div class="profile-item">
            <div class="profile-item-body">
              <div class="profile-item-title">Размер шрифта</div>
              <div class="profile-item-sub">Для удобства чтения</div>
            </div>
            <select id="font-size-select" class="profile-select">
              <option value="small">Маленький</option>
              <option value="normal" selected>Обычный</option>
              <option value="large">Большой</option>
            </select>
          </div>

          <div class="profile-item">
            <div class="profile-item-body">
              <div class="profile-item-title">Тема оформления</div>
              <div class="profile-item-sub">Светлая или тёмная</div>
            </div>
            <select id="theme-select" class="profile-select">
              <option value="light" selected>☀️ День</option>
              <option value="dark">🌙 Ночь</option>
            </select>
          </div>

          <div class="profile-section-title" style="margin-top: 8px;">Доверенные лица</div>
          <div class="profile-trusted-desc">Добавьте контакты близких. Когда возникает проблема, я могу отправить им описание ситуации.</div>

          ${contactsHtml}

          <button id="add-contact-btn" class="big-action-btn">
            + Добавить доверенное лицо
          </button>

          <div class="profile-section-title" style="margin-top: 16px;">Подписка</div>

          <div class="profile-item" id="subscription-btn">
            <div class="profile-item-body">
              <div class="profile-item-title">Управление подпиской</div>
              <div class="profile-item-sub">Базовый · 299 ₽/мес</div>
            </div>
            <div class="profile-item-arrow">→</div>
          </div>

          <div class="profile-section-title" style="margin-top: 16px;">О приложении</div>

          <a href="/terms.html" target="_blank" class="profile-item">
            <div class="profile-item-body">
              <div class="profile-item-title">Пользовательское соглашение</div>
            </div>
            <div class="profile-item-arrow">→</div>
          </a>

          <a href="/privacy.html" target="_blank" class="profile-item">
            <div class="profile-item-body">
              <div class="profile-item-title">Политика конфиденциальности</div>
            </div>
            <div class="profile-item-arrow">→</div>
          </a>

          <a href="/requisites.html" target="_blank" class="profile-item">
            <div class="profile-item-body">
              <div class="profile-item-title">Реквизиты</div>
              <div class="profile-item-sub">ИП Коваленко Евгений Сергеевич</div>
            </div>
            <div class="profile-item-arrow">→</div>
          </a>

          <div class="profile-app-version">OkTolk v1.0 · oktolk.ru</div>

          <button id="logout-btn" class="profile-logout-btn">
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
            <div>
              <label style="font-size: 14px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Telegram</label>
              <input id="modal-telegram" type="text" placeholder="@username" style="width: 100%; padding: 16px 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 18px; font-weight: 600; outline: none;">
            </div>
            <div>
              <label style="font-size: 14px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">VK / Макс</label>
              <input id="modal-vk" type="text" placeholder="id или ник" style="width: 100%; padding: 16px 18px; background: #F7F7F7; border: 2px solid #E0E0E0; border-radius: 16px; font-family: Nunito, sans-serif; font-size: 18px; font-weight: 600; outline: none;">
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
      document.getElementById('modal-telegram').value = '';
      document.getElementById('modal-vk').value = '';
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
        const telegram = document.getElementById('modal-telegram').value.trim();
        const vk = document.getElementById('modal-vk').value.trim();
        if (!name) { document.getElementById('modal-name').style.borderColor = '#D32F2F'; return; }
        if (!role) { document.getElementById('modal-role').style.borderColor = '#D32F2F'; return; }
        PomoshnikDB.addTrustedContact(name, role, phone, telegram || vk || '');
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
