window.ScreenSites = {
  sites: [],

  render: function() {
    return `
      <div class="sites-screen">
        <div style="padding: 12px 0 24px;">
          <h2 style="font-family: 'Lora', serif; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px;">Проверенные <em style="font-style: italic; color: var(--accent);">сайты</em></h2>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.5;">Здесь только официальные сайты органов власти и учреждений. Будьте осторожны с другими сайтами!</p>
        </div>

        <div id="sites-list"></div>
      </div>
    `;
  },

  renderSites: function(sites) {
    let html = '';
    sites.forEach(site => {
      html += `
        <a href="${site.url}" target="_blank" rel="noopener" class="site-card">
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; margin-bottom: 14px; text-decoration: none; color: inherit;">
            <div style="width: 56px; height: 56px; border-radius: 16px; background: #F4F9F6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 2px solid #E0E0E0;">
              <img src="https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.style.display='none';this.parentElement.innerHTML='🏛️'">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 2px;">${site.name}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${site.description}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; word-break: break-all;">${site.url}</div>
            </div>
            <div style="font-size: 22px; opacity: 0.6;">→</div>
          </div>
        </a>
      `;
    });
    return html;
  },

  init: async function() {
    this.sites = await PomoshnikAPI.getSafeWebsites();
    const listContainer = document.getElementById('sites-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderSites(this.sites);
    }
  }
};
