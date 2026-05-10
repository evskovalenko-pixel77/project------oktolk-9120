window.ScreenAnswer = {
  currentAnalysis: null,

  render: function(analysis) {
    this.currentAnalysis = analysis;
    const riskLevel = analysis.riskLevel || 0;
    const recommendations = analysis.recommendations || [];
    
    let verdictHtml = '';
    let verdictClass = '';
    
    if (riskLevel >= 3) {
      verdictClass = 'verdict-danger';
      verdictHtml = `
        <div class="verdict-banner ${verdictClass}">
          <div class="verdict-icon-bg">🛑</div>
          <div class="verdict-body">
            <div class="verdict-label">Подождите!</div>
            <div class="verdict-text">Я заметил признаки мошенничества</div>
          </div>
        </div>
      `;
    } else if (riskLevel === 2) {
      verdictClass = 'verdict-warning';
      verdictHtml = `
        <div class="verdict-banner ${verdictClass}">
          <div class="verdict-icon-bg">⚠️</div>
          <div class="verdict-body">
            <div class="verdict-label">Внимание</div>
            <div class="verdict-text">Несколько моментов, которые нужно проверить</div>
          </div>
        </div>
      `;
    } else if (riskLevel === 1) {
      verdictHtml = `
        <div style="background: var(--accent-soft); border-radius: 16px; padding: 12px 14px; margin-bottom: 18px;">
          <div style="font-size: 14px; color: var(--text-primary);">💡 Я заметил кое-что интересное. <a href="#" style="color: var(--accent); font-weight: 700; text-decoration: none;">Подробнее</a></div>
        </div>
      `;
    }

    let recommendationsHtml = '';
    if (recommendations.length > 0) {
      recommendationsHtml = `
        <div class="answer-block">
          <div class="block-label">
            <div class="block-icon">✓</div>
            <h3>Рекомендации</h3>
          </div>
          <ol>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ol>
        </div>
      `;
    }

    const trustedContacts = PomoshnikDB.getTrustedContacts();
    let contactsHtml = '';
    if (trustedContacts.length > 0 && riskLevel < 3) {
      contactsHtml = `
        <div class="actions-grid">
          ${trustedContacts.map(contact => `
            <button class="act-btn" data-contact-id="${contact.id}" title="Отправить ${contact.name}">
              📲 ${contact.name}
            </button>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="answer-screen">
        <div class="screen-header">
          <button class="back-btn" id="back-btn">←</button>
          <div class="screen-title">Результат</div>
        </div>

        ${verdictHtml}

        <div class="answer-block">
          <div class="block-label">
            <div class="block-icon">🤖</div>
            <h3>Анализ</h3>
          </div>
          <p>${analysis.analysis}</p>
        </div>

        ${recommendationsHtml}

        ${contactsHtml}

        <div class="actions-grid" style="margin-top: 20px;">
          <button class="act-btn" id="play-btn">
            🔊 Озвучить
          </button>
          <button class="act-btn" id="share-btn">
            📤 Поделиться
          </button>
        </div>
      </div>
    `;
  },

  init: function() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.pomoshnikApp.showScreen('home');
      });
    }

    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', async () => {
        const text = this.currentAnalysis.analysis;
        playBtn.disabled = true;
        playBtn.textContent = '⏳ Озвучиваю...';
        
        const result = await PomoshnikMultimedia.textToSpeech(text);
        
        playBtn.disabled = false;
        playBtn.textContent = '🔊 Озвучить';
        
        if (!result.success) {
          alert('Ошибка: ' + result.error);
        }
      });
    }

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const text = this.currentAnalysis.analysis;
        const result = await PomoshnikMultimedia.shareMessage(
          'Результат анализа от Помощника',
          text
        );
        
        if (result.success) {
          if (result.copied) {
            alert('Текст скопирован в буфер обмена');
          }
        }
      });
    }

    const contactBtns = document.querySelectorAll('.actions-grid .act-btn[data-contact-id]');
    contactBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const contactId = btn.dataset.contactId;
        const contacts = PomoshnikDB.getTrustedContacts();
        const contact = contacts.find(c => c.id === contactId);
        
        if (contact) {
          window.pomoshnikApp.sendToContact(contact, this.currentAnalysis);
        }
      });
    });
  }
};
