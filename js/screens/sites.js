window.ScreenSites = {
  sites: [],

  render: function() {
    return '<div class="sites-screen">' +
      '<div style="padding: 12px 0 20px;">' +
        '<h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">Проверенные сайты</h2>' +
        '<p style="font-size: 17px; color: #444; line-height: 1.5; font-weight: 600;">Здесь только официальные сайты органов власти и учреждений. Будьте осторожны с другими сайтами!</p>' +
      '</div>' +
      '<div id="sites-list"></div>' +
    '</div>';
  },

  renderSites: function(sites) {
    var icons = {
      'mvd.ru': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Emblem_of_the_Ministry_of_Internal_Affairs.svg/120px-Emblem_of_the_Ministry_of_Internal_Affairs.svg.png',
      'mfc.ru': 'https://rp-konosha-r29.gosweb.gosuslugi.ru/netcat_files/37/45/moi_doki_0.jpg'
    };
    var html = '';
    sites.forEach(function(site) {
      var domain = '';
      try { domain = new URL(site.url).hostname; } catch(e) { domain = site.url; }
      var iconUrl = icons[domain] || 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
      html += '<a href="' + site.url + '" target="_blank" rel="noopener" style="text-decoration: none; color: inherit; display: block; margin-bottom: 12px;">' +
        '<div style="display: flex; align-items: center; gap: 16px; padding: 18px; background: white; border: 2px solid #E0E0E0; border-radius: 20px;">' +
          '<div style="width: 56px; height: 56px; border-radius: 16px; background: #F4F9F6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 2px solid #E0E0E0;">' +
            '<img src="' + iconUrl + '" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px;" onerror="this.parentElement.textContent=\'🏛️\'">' +
          '</div>' +
          '<div style="flex: 1;">' +
            '<div style="font-size: 20px; font-weight: 900; margin-bottom: 3px;">' + site.name + '</div>' +
            '<div style="font-size: 16px; color: #777; font-weight: 600;">' + site.description + '</div>' +
            '<div style="font-size: 14px; color: #2A7D4F; margin-top: 4px; font-weight: 700;">' + site.url + '</div>' +
          '</div>' +
          '<div style="width: 36px; height: 36px; background: #F4F9F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">' +
            '<span style="font-size: 18px; color: #444;">&#8594;</span>' +
          '</div>' +
        '</div>' +
      '</a>';
    });
    return html;
  },

  init: async function() {
    this.sites = await PomoshnikAPI.getSafeWebsites();
    var listContainer = document.getElementById('sites-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderSites(this.sites);
    }
  }
};
