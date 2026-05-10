window.PomoshnikUtils = {
  uid: function() {
    return 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  formatDate: function(date) {
    if (typeof date === 'string') date = new Date(date);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return (d < 10 ? '0' : '') + d + '.' + (m < 10 ? '0' : '') + m + '.' + y;
  },

  formatTime: function(date) {
    if (typeof date === 'string') date = new Date(date);
    const h = date.getHours();
    const m = date.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  getDayAgo: function(date) {
    if (typeof date === 'string') date = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + 'м назад';
    if (diff < 86400) return Math.floor(diff / 3600) + 'ч назад';
    return Math.floor(diff / 86400) + 'д назад';
  },

  clone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  escapeHtml: function(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  parseMarkdown: function(text) {
    let html = this.escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  },

  getGreeting: function() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  }
};
