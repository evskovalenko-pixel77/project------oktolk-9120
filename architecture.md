# Architecture
## Stack: Python FastAPI + SQLite + external AI/Telegram APIs
## Modules
- auth: registration, login, JWT
- chatbot: AI chat with scam detection
- risk_analysis: score 0-3 for messages/calls
- news_feed: fetch, simplify, translate news
- voice: STT, TTS integration
- notifications: Telegram alerts to trusted contacts
- pwa_frontend: Progressive Web App (Vue.js)
- tests: unit and integration