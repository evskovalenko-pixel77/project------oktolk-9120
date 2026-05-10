window.OkTolkAPI = {
  baseURL: 'https://oktolk.ru',

  request: async function(endpoint, data) {
    const response = await fetch(this.baseURL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  analyzeText: async function(text) {
    return await this.request('/analyze/text', { text });
  },

  chat: async function(message, history = []) {
    return await this.request('/chat', { message, history });
  },

  register: async function(phone, name) {
    return await this.request('/auth/register', { phone, name });
  },

  login: async function(phone) {
    return await this.request('/auth/login', { phone });
  }
};

window.PomoshnikAPI = window.OkTolkAPI;

window.OkTolkAPI.processInput = async function(text) {
  return await this.chat(text);
};
window.OkTolkAPI.getNews = async function() {
  const response = await fetch(this.baseURL + '/news');
  return response.json();
};
window.OkTolkAPI.getSafeWebsites = async function() {
  const response = await fetch(this.baseURL + '/sites');
  return response.json();
};
window.PomoshnikAPI.processInput = window.OkTolkAPI.processInput.bind(window.OkTolkAPI);
window.PomoshnikAPI.getNews = window.OkTolkAPI.getNews.bind(window.OkTolkAPI);
window.PomoshnikAPI.getSafeWebsites = window.OkTolkAPI.getSafeWebsites.bind(window.OkTolkAPI);
