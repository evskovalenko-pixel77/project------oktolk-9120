window.PomoshnikDB = {
  getCurrentUser: function() {
    const user = localStorage.getItem('pomoshnik_user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: function(user) {
    localStorage.setItem('pomoshnik_user', JSON.stringify(user));
  },

  clearCurrentUser: function() {
    localStorage.removeItem('pomoshnik_user');
  },

  createUser: function(phone, name = '') {
    const user = {
      id: PomoshnikUtils.uid(),
      phone: phone,
      name: name,
      createdAt: new Date().toISOString(),
      requestsToday: 0,
      requestsReset: new Date().toISOString(),
      isPaid: false,
      fontSize: 'normal',
      trustedContacts: []
    };
    this.setCurrentUser(user);
    return user;
  },

  addTrustedContact: function(name, role, phone, telegram = '') {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    const contact = {
      id: PomoshnikUtils.uid(),
      name: name,
      role: role,
      phone: phone,
      telegram: telegram,
      addedAt: new Date().toISOString()
    };
    
    user.trustedContacts.push(contact);
    this.setCurrentUser(user);
    return contact;
  },

  getTrustedContacts: function() {
    const user = this.getCurrentUser();
    return user ? user.trustedContacts : [];
  },

  removeTrustedContact: function(contactId) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    user.trustedContacts = user.trustedContacts.filter(c => c.id !== contactId);
    this.setCurrentUser(user);
    return true;
  },

  getRequestCount: function() {
    const user = this.getCurrentUser();
    if (!user) return 0;
    
    const today = new Date().toDateString();
    const resetDate = new Date(user.requestsReset).toDateString();
    
    if (today !== resetDate) {
      user.requestsToday = 0;
      user.requestsReset = new Date().toISOString();
      this.setCurrentUser(user);
    }
    
    return user.requestsToday;
  },

  incrementRequestCount: function() {
    const user = this.getCurrentUser();
    if (!user) return 0;
    
    user.requestsToday++;
    this.setCurrentUser(user);
    return user.requestsToday;
  },

  addHistory: function(type, input, output) {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    const history = JSON.parse(localStorage.getItem('pomoshnik_history') || '[]');
    const item = {
      id: PomoshnikUtils.uid(),
      userId: user.id,
      type: type,
      input: input,
      output: output,
      timestamp: new Date().toISOString()
    };
    
    history.push(item);
    localStorage.setItem('pomoshnik_history', JSON.stringify(history));
    return item;
  },

  getHistory: function(limit = 10) {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    const history = JSON.parse(localStorage.getItem('pomoshnik_history') || '[]');
    return history
      .filter(h => h.userId === user.id)
      .reverse()
      .slice(0, limit);
  },

  setFontSize: function(size) {
    const user = this.getCurrentUser();
    if (user) {
      user.fontSize = size;
      this.setCurrentUser(user);
    }
  },

  getFontSize: function() {
    const user = this.getCurrentUser();
    return user ? user.fontSize : 'normal';
  }
};
