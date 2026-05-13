window.ScreenSites = {
  activeCategory: null,

  categories: {
    gov: {
      title: 'Госорганы',
      icon: '🏛️',
      color: '#1565C0',
      bg: '#E3F2FD',
      sites: [
        { name: 'Госуслуги', url: 'https://gosuslugi.ru', desc: 'Государственные услуги онлайн' },
        { name: 'СФР (ПФР)', url: 'https://sfr.gov.ru', desc: 'Социальный фонд России' },
        { name: 'МФЦ', url: 'https://mfc.ru', desc: 'Мои документы — центр услуг' },
        { name: 'ФНС', url: 'https://nalog.gov.ru', desc: 'Федеральная налоговая служба' },
        { name: 'МВД', url: 'https://mvd.ru', desc: 'Сообщить о мошенниках' },
        { name: 'Минздрав', url: 'https://minzdrav.gov.ru', desc: 'Здоровье и медицина' },
        { name: 'Банк России', url: 'https://cbr.ru', desc: 'Центральный банк — проверка банков' },
      ]
    },
    shops: {
      title: 'Магазины',
      icon: '🛒',
      color: '#E65100',
      bg: '#FFF3E0',
      sites: [
        { name: 'Сбермаркет', url: 'https://sbermarket.ru', desc: 'Продукты с доставкой' },
        { name: 'Перекрёсток', url: 'https://perekrestok.ru', desc: 'Продукты онлайн' },
        { name: 'Wildberries', url: 'https://wildberries.ru', desc: 'Маркетплейс' },
        { name: 'Ozon', url: 'https://ozon.ru', desc: 'Маркетплейс' },
        { name: 'Яндекс Маркет', url: 'https://market.yandex.ru', desc: 'Сравнение цен и покупки' },
        { name: 'DNS', url: 'https://dns-shop.ru', desc: 'Электроника и техника' },
      ]
    },
    pharma: {
      title: 'Аптеки',
      icon: '💊',
      color: '#2A7D4F',
      bg: '#E8F5EE',
      sites: [
        { name: 'Аптека.ру', url: 'https://apteka.ru', desc: 'Поиск лекарств и цен' },
        { name: 'Ригла', url: 'https://rigla.ru', desc: 'Сеть аптек' },
        { name: 'Сбераптека', url: 'https://eapteka.ru', desc: 'Доставка лекарств' },
        { name: '36.6', url: 'https://366.ru', desc: 'Сеть аптек' },
        { name: 'Здравсити', url: 'https://zdravcity.ru', desc: 'Аптека онлайн' },
        { name: 'Горздрав', url: 'https://gorzdrav.org', desc: 'Аптека с доставкой' },
      ]
    },
    leisure: {
      title: 'Досуг',
      icon: '🎭',
      color: '#6A1B9A',
      bg: '#F3E5F5',
      sites: [
        { name: 'Афиша', url: 'https://afisha.ru', desc: 'Концерты, кино, театры' },
        { name: 'Кинопоиск', url: 'https://kinopoisk.ru', desc: 'Фильмы и сериалы' },
        { name: 'РЖД', url: 'https://rzd.ru', desc: 'Купить билеты на поезд' },
        { name: 'Aviasales', url: 'https://aviasales.ru', desc: 'Дешёвые авиабилеты' },
        { name: 'Туту.ру', url: 'https://tutu.ru', desc: 'Билеты на транспорт' },
        { name: 'Литрес', url: 'https://litres.ru', desc: 'Электронные книги' },
      ]
    }
  },

  render: function() {
    return `
      <div class="sites-screen">
        <div class="sites-header">
          <div class="sites-header-title">Сайты</div>
          <div class="sites-header-sub">Проверенные ресурсы по категориям</div>
        </div>
        <div class="sites-grid" id="sites-grid">
          <div class="sites-tile" data-cat="gov">
            <div class="sites-tile-icon">🏛️</div>
            <div class="sites-tile-name">Госорганы</div>
            <div class="sites-tile-count">7 сайтов</div>
          </div>
          <div class="sites-tile" data-cat="shops">
            <div class="sites-tile-icon">🛒</div>
            <div class="sites-tile-name">Магазины</div>
            <div class="sites-tile-count">6 сайтов</div>
          </div>
          <div class="sites-tile" data-cat="pharma">
            <div class="sites-tile-icon">💊</div>
            <div class="sites-tile-name">Аптеки</div>
            <div class="sites-tile-count">6 сайтов</div>
          </div>
          <div class="sites-tile" data-cat="leisure">
            <div class="sites-tile-icon">🎭</div>
            <div class="sites-tile-name">Досуг</div>
            <div class="sites-tile-count">6 сайтов</div>
          </div>
        </div>
        <div id="sites-detail" style="display:none;"></div>
      </div>
    `;
  },

  renderDetail: function(catKey) {
    const cat = this.categories[catKey];
    let sitesHtml = cat.sites.map(site => {
      const domain = new URL(site.url).hostname;
      const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      return `
        <a href="${site.url}" target="_blank" rel="noopener" class="site-item">
          <img src="${icon}" class="site-item-icon" onerror="this.style.display='none'">
          <div class="site-item-body">
            <div class="site-item-name">${site.name}</div>
            <div class="site-item-desc">${site.desc}</div>
          </div>
          <div class="site-item-arrow">→</div>
        </a>
      `;
    }).join('');

    return `
      <div class="sites-detail">
        <button class="sites-back-btn" id="sites-back">
          ← Все категории
        </button>
        <div class="sites-detail-header" style="background:${cat.bg}; border-left: 4px solid ${cat.color};">
          <span style="font-size:28px;">${cat.icon}</span>
          <span class="sites-detail-title" style="color:${cat.color};">${cat.title}</span>
        </div>
        <div class="sites-list">${sitesHtml}</div>
      </div>
    `;
  },

  init: function() {
    const grid = document.getElementById('sites-grid');
    if (grid) {
      grid.querySelectorAll('.sites-tile').forEach(tile => {
        tile.addEventListener('click', () => {
          const cat = tile.dataset.cat;
          this.showCategory(cat);
        });
      });
    }
  },

  showCategory: function(catKey) {
    const grid = document.getElementById('sites-grid');
    const detail = document.getElementById('sites-detail');
    const header = document.querySelector('.sites-header');
    if (grid) grid.style.display = 'none';
    if (header) header.style.display = 'none';
    if (detail) {
      detail.style.display = 'block';
      detail.innerHTML = this.renderDetail(catKey);
      document.getElementById('sites-back').addEventListener('click', () => {
        detail.style.display = 'none';
        if (grid) grid.style.display = 'grid';
        if (header) header.style.display = 'block';
      });
    }
  }
};
