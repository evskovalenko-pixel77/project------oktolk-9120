window.ScreenProfile = {
  render: function() {
    const user = PomoshnikDB.getCurrentUser();
    const contacts = PomoshnikDB.getTrustedContacts();

    let contactsHtml = '';
    if (contacts.length > 0) {
      contactsHtml = `
        <div style="margin-bottom: 28px;">
          <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Доверенные лица</h3>
      `;
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
      contactsHtml += `</div>`;
    }

    return `
      <div class="profile-screen">
        <div style="padding: 12px 0 24px;">
          <h2 style="font-family: 'Lora', serif; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px;">Мое <em style="font-style: italic; color: var(--accent);">профилю</em></h2>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
            <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">👤</div>
            <div>
              <div style="font-weight: 700; font-size: 18px;">${user.name || 'Пользователь'}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${user.phone}</div>
            </div>
          </div>
        </div>

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
            <div style="font-weight: 700; margin-bottom: 2px;">Темная тема</div>
            <div style="font-size: 13px; color: var(--text-muted);">Для глаз ночью</div>
          </div>
          <input type="checkbox" id="dark-mode-toggle" style="width: 40px; height: 24px; cursor: pointer;">
        </div>

        <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Доверенные лица</h3>
      `;
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
      contactsHtml += `</div>`;
    }

    return `
      <div class="profile-screen">
        <div style="padding: 12px 0 24px;">
          <h2 style="font-family: 'Lora', serif; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px;">Мое <em style="font-style: italic; color: var(--accent);">профилю</em></h2>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
            <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">👤</div>
            <div>
              <div style="font-weight: 700; font-size: 18px;">${user.name || 'Пользователь'}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${user.phone}</div>
            </div>
          </div>
        </div>

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
            <div style="font-weight: 700; margin-bottom: 2px;">Темная тема</div>
            <div style="font-size: 13px; color: var(--text-muted);">Для глаз ночью</div>
          </div>
          <input type="checkbox" id="dark-mode-toggle" style="width: 40px; height: 24px; cursor: pointer;">
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 24px;">
          <div style="font-weight: 700; margin-bottom: 4px;">⚡ API ключ aiTunnel</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
            Без ключа используются локальные советы.<br>
            <strong>Как получить ключ:</strong><br>
            1. Перейдите на <a href="https://aitunnel.ru" target="_blank" style="color: var(--accent); text-decoration: underline;">aitunnel.ru</a><br>
            2. Зарегистрируйтесь (от 299₽)<br>
            3. Получите ключ в разделе "Ключи"<br>
            4. Вставьте ключ ниже
          </div>
          <input type="password" id="api-key-input" placeholder="sk-aitunnel-xxx" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); color: var(--text-primary); font-family: monospace; font-size: 11px; margin-bottom: 10px; box-sizing: border-box;">
          <button id="save-api-key-btn" style="width: 100%; padding: 10px; background: var(--accent); border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 8px;">💾 Сохранить ключ</button>
          <div id="api-key-status" style="font-size: 12px; color: var(--text-muted); text-align: center; min-height: 20px;"></div>
          <button id="api-key-debug-btn" style="width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); font-weight: 600; cursor: pointer; font-family: inherit; font-size: 11px; margin-top: 8px;">🔍 Проверить API</button>
        </div>

        <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Доверенные лица</h3>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 14px;">Добавьте контакты близких. Когда возникает проблема, я могу отправить им описание ситуации.</p>

        ${contactsHtml}

        <button id="add-contact-btn" class="big-action-btn" style="margin-bottom: 14px;">
          <span>+</span> Добавить доверенное лицо
        </button>

        <h3 style="font-family: 'Lora', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px; margin-top: 24px; display: none;">Подписка</h3>
        <div style="background: var(--accent-soft); border: 1px solid #B8D4CB; border-radius: 16px; padding: 14px; margin-bottom: 14px; display: none;">
          <div style="font-weight: 700; color: var(--accent-dark); margin-bottom: 4px;">Бесплатный план</div>
          <div style="font-size: 13px; color: var(--text-secondary);">3 запроса в сутки</div>
          <div id="request-counter" style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);"></div>
        </div>

        <button id="share-app-btn" class="big-action-btn" style="margin-bottom: 14px; display: none;">
          <span>📤</span> Поделиться приложением
        </button>

        <button id="logout-btn" style="width: 100%; padding: 14px; background: transparent; border: 1px solid var(--danger); color: var(--danger); border-radius: 12px; font-family: inherit; font-weight: 700; cursor: pointer;">
          Выйти
        </button>
      </div>
    `;
  },

  init: function() {
     const user = PomoshnikDB.getCurrentUser();
     
     const requestCounter = document.getElementById('request-counter');
     if (requestCounter) {
       requestCounter.style.display = 'none';
     }

    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
      fontSizeSelect.value = PomoshnikDB.getFontSize();
      fontSizeSelect.addEventListener('change', (e) => {
        PomoshnikDB.setFontSize(e.target.value);
        const root = document.documentElement;
        const fontSizes = {
          small: '14px',
          normal: '16px',
          large: '18px'
        };
        root.style.fontSize = fontSizes[e.target.value];
      });
    }

    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');

    if (apiKeyInput && saveApiKeyBtn) {
      const savedKey = localStorage.getItem('pomoshnik_api_key');
      if (savedKey) {
        apiKeyInput.value = savedKey;
        if (apiKeyStatus) {
          apiKeyStatus.textContent = '✓ Ключ сохранён';
          apiKeyStatus.style.color = '#27ae60';
        }
      }

      saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
          if (apiKeyStatus) {
            apiKeyStatus.textContent = '⚠️ Введите ключ';
            apiKeyStatus.style.color = '#e74c3c';
          }
          return;
        }
        
        PomoshnikAPI.setAPIKey(apiKey);
        if (apiKeyStatus) {
          apiKeyStatus.textContent = '✓ Ключ сохранён успешно';
          apiKeyStatus.style.color = '#27ae60';
        }
        
        setTimeout(() => {
           if (apiKeyStatus) {
             apiKeyStatus.textContent = '';
           }
         }, 3000);
       });
     }

     const apiKeyDebugBtn = document.getElementById('api-key-debug-btn');
     if (apiKeyDebugBtn) {
       apiKeyDebugBtn.addEventListener('click', () => {
         const savedKey = localStorage.getItem('pomoshnik_api_key');
         const apiStatus = document.getElementById('api-key-status');
         
         let debugInfo = '';
         debugInfo += '🔍 Статус API:\n';
         debugInfo += 'Ключ: ' + (savedKey ? savedKey.substring(0, 10) + '...' : 'НЕ НАЙДЕН') + '\n';
         debugInfo += 'URL: ' + PomoshnikAPI.abacusURL + '\n';
         debugInfo += 'Загрузить ключ можно из консоли браузера (F12)';
         
         if (apiStatus) {
           apiStatus.textContent = debugInfo;
           apiStatus.style.color = '#2980b9';
           apiStatus.style.whiteSpace = 'pre-wrap';
           apiStatus.style.fontSize = '11px';
           apiStatus.style.textAlign = 'left';
         }
         
         console.log('=== Abacus API Debug Info ===');
         console.log('Сохранённый ключ:', savedKey ? savedKey.substring(0, 10) + '...' : 'НЕТ');
         console.log('API URL:', PomoshnikAPI.abacusURL);
         console.log('window.abacusAPIKey:', window.abacusAPIKey || 'НЕТ');
         console.log('localStorage:', localStorage.getItem('pomoshnik_api_key') ? 'ЕСТЬ' : 'НЕТ');
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
        const contactId = btn.dataset.contactId;
        if (confirm('Удалить это контактное лицо?')) {
          PomoshnikDB.removeTrustedContact(contactId);
          window.pomoshnikApp.showScreen('profile');
        }
      });
    });

    const shareAppBtn = document.getElementById('share-app-btn');
    if (shareAppBtn) {
      shareAppBtn.addEventListener('click', async () => {
        const result = await PomoshnikMultimedia.shareMessage(
          'Помощник — мобильное приложение',
          'Установите приложение \"Помощник\" — оно помогает разобраться в сложных бытовых вопросах. Очень удобно!',
          window.location.href
        );
      });
    }

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
