window.ScreenNews = {
  news: [],
  currentTab: 'all',

  render: function() {
    return `
      <div class="news-screen">
        <div class="news-hero">
          <div class="news-title">Что новое</div>
          <button class="listen-all-btn" id="listen-all-btn">
            <div class="listen-icon">🎧</div>
            <div class="listen-text">
              <div class="listen-title">Слушать все новости</div>
              <div class="listen-sub">Как утреннее радио</div>
            </div>
            <div class="listen-arrow">→</div>
          </button>
        </div>

        <div class="news-tabs" id="news-tabs">
          <button class="news-tab active" data-tab="all">
            Все
            <span class="tab-count" id="count-all">0</span>
          </button>
          <button class="news-tab" data-tab="danger">
            ⚠️ Опасное
            <span class="tab-count" id="count-danger">0</span>
          </button>
          <button class="news-tab" data-tab="benefit">
            ✓ Льготы
            <span class="tab-count" id="count-benefit">0</span>
          </button>
          <button class="news-tab" data-tab="info">
            ℹ️ Информация
            <span class="tab-count" id="count-info">0</span>
          </button>
        </div>

        <div id="news-content"></div>
      </div>
    `;
  },

  renderNews: function(news) {
    let filtered = news;
    
    if (this.currentTab !== 'all') {
      filtered = news.filter(n => n.type === this.currentTab);
    }

    let html = '';
    filtered.forEach((item, index) => {
      const timeAgo = PomoshnikUtils.getDayAgo(item.timestamp);
      const typeEmoji = item.type === 'danger' ? '⚠️' : item.type === 'benefit' ? '✓' : 'ℹ️';
      
      html += `
        <div class="news-card ${item.type}">
          <div class="news-card-meta">
            <span class="news-card-badge">${typeEmoji} ${item.type === 'danger' ? 'Опасно' : item.type === 'benefit' ? 'Льгота' : 'Информация'}</span>
            <span class="news-card-time">${timeAgo}</span>
          </div>
          <div class="news-card-title">${item.title}</div>
          <div class="news-card-text">${item.content}</div>
          <div class="news-card-source">📍 ${item.source}</div>
          <div class="news-card-buttons">
            <a href="${item.url || '#'}" target="_blank" rel="noopener">🔗 Источник</a>
            <button class="explain-btn" data-news-index="${index}">💡 Объясни</button>
          </div>
        </div>
      `;
    });

    return html || '<div class="news-empty">Нет новостей</div>';
  },

  init: async function() {
    this.news = await PomoshnikAPI.getNews();

    const tabs = document.querySelectorAll('.news-tab');
    const newsContent = document.getElementById('news-content');

    const updateCounts = () => {
      const types = ['all', 'danger', 'benefit', 'info'];
      types.forEach(type => {
        const count = type === 'all' ? this.news.length : this.news.filter(n => n.type === type).length;
        const el = document.getElementById('count-' + type);
        if (el) el.textContent = count;
      });
    };

    updateCounts();

    const renderContent = () => {
      if (newsContent) {
        newsContent.innerHTML = this.renderNews(this.news);
        this.attachExplainButtonListeners();
      }
    };

    renderContent();

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        renderContent();
      });
    });

    const listenAllBtn = document.getElementById('listen-all-btn');
    if (listenAllBtn) {
      listenAllBtn.addEventListener('click', async () => {
        listenAllBtn.disabled = true;
        listenAllBtn.innerHTML = '<div class="listen-icon">⏳</div><div class="listen-text"><div class="listen-title">Загружаю...</div></div>';
        
        const newsText = this.news.map(n => `${n.title}. ${n.content}.`).join(' ');
        const result = await PomoshnikMultimedia.textToSpeech(newsText);
        
        listenAllBtn.disabled = false;
        listenAllBtn.innerHTML = '<div class="listen-icon">🎧</div><div class="listen-text"><div class="listen-title">Слушать все новости</div><div class="listen-sub">Как утреннее радио</div></div><div class="listen-arrow">→</div>';
      });
    }
  },

  attachExplainButtonListeners: function() {
    const explainBtns = document.querySelectorAll('.explain-btn');
    explainBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newsIndex = parseInt(btn.dataset.newsIndex);
        const newsItem = this.news[newsIndex];
        if (newsItem) {
          this.showNewsExplainDialog(newsItem);
        }
      });
    });
  },

  showNewsExplainDialog: async function(newsItem) {
    const content = document.getElementById('content');
    const dialogHtml = `
      <div class="news-explain-dialog">
        <div class="dialog-overlay" id="dialog-overlay"></div>
        <div class="dialog-window">
          <div class="dialog-header">
            <div class="dialog-title">Объяснение новости</div>
            <button class="close-dialog-btn" id="close-dialog">×</button>
          </div>
          <div class="dialog-content" id="dialog-content">
            <div class="loading">
              <div class="spinner"></div>
              <div class="loading-text">Анализирую новость...</div>
            </div>
          </div>
          <div class="dialog-input-section">
            <input type="text" id="follow-up-input" class="follow-up-input" placeholder="Задайте вопрос по этой новости..." />
            <button id="follow-up-btn" class="follow-up-btn">→</button>
          </div>
        </div>
      </div>
    `;

    content.insertAdjacentHTML('beforeend', dialogHtml);

    const overlay = document.getElementById('dialog-overlay');
    const closeBtn = document.getElementById('close-dialog');
    const dialogContent = document.getElementById('dialog-content');

    overlay.addEventListener('click', () => {
      document.querySelector('.news-explain-dialog').remove();
    });

    closeBtn.addEventListener('click', () => {
      document.querySelector('.news-explain-dialog').remove();
    });

    const prompt = `Объясни по простому следующую новость:
    
Заголовок: ${newsItem.title}
Содержание: ${newsItem.content}

Дай простое и понятное объяснение что происходит, почему это важно, и как это может повлиять на обычного человека.`;

    try {
      const result = await PomoshnikAPI.callAbacusAPI(prompt);
      dialogContent.innerHTML = `<div class="explanation-text">${result}</div>`;
    } catch (error) {
      dialogContent.innerHTML = `<div class="explanation-text">К сожалению, не удалось получить объяснение: ${error.message}</div>`;
    }

    const followUpInput = document.getElementById('follow-up-input');
    const followUpBtn = document.getElementById('follow-up-btn');

    followUpBtn.addEventListener('click', async () => {
      const question = followUpInput.value.trim();
      if (!question) return;

      followUpInput.disabled = true;
      followUpBtn.disabled = true;

      dialogContent.innerHTML += `
        <div class="dialog-user-msg">
          ${question}
        </div>
        <div class="dialog-ai-msg">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      `;

      try {
        const followUpResult = await PomoshnikAPI.callAbacusAPI(question);
        const aiMessageDiv = dialogContent.querySelector('.dialog-ai-msg:last-of-type');
        aiMessageDiv.innerHTML = followUpResult;
      } catch (error) {
        const aiMessageDiv = dialogContent.querySelector('.dialog-ai-msg:last-of-type');
        aiMessageDiv.innerHTML = 'Ошибка получения ответа: ' + error.message;
      }

      followUpInput.value = '';
      followUpInput.disabled = false;
      followUpBtn.disabled = false;
      dialogContent.scrollTop = dialogContent.scrollHeight;
    });

    followUpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        followUpBtn.click();
      }
    });
  }
};
