import sys, os, requests, json, re
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'auth'))
from src.auth.main import app

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

AITUNNEL_API_KEY = os.getenv("AITUNNEL_API_KEY", "")
AITUNNEL_BASE_URL = os.getenv("AITUNNEL_BASE_URL", "https://api.aitunnel.ru/v1/")

SYSTEM_PROMPT = "Ты помощник OkTolk для людей 40+. Говори просто. Давай пошаговые инструкции. При мошенничестве: СТОП! Это мошенники!"

class ChatRequest(BaseModel):
    message: str
    history: Optional[List] = []

class AnalyzeRequest(BaseModel):
    text: str

def call_ai(messages, model="deepseek-v3.2"):
    headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
    data = {"model": model, "messages": messages, "max_tokens": 500, "temperature": 0.7}
    response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
    return response.json()["choices"][0]["message"]["content"]

@app.get("/")
async def root():
    return FileResponse("index.html")

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in req.history[-10:]:
        messages.append(h)
    messages.append({"role": "user", "content": req.message})
    reply = call_ai(messages)
    return {"reply": reply, "risk_level": 0}

@app.post("/analyze/text")
async def analyze_text(req: AnalyzeRequest):
    scam_keywords = ["код из смс", "переведи деньги", "данные карты", "номер карты", "cvv", "пин-код", "срочно переведи", "выиграли", "одобрен кредит", "заблокирован счет"]
    text_lower = req.text.lower()
    risk_level = 0
    signs = []
    for kw in scam_keywords:
        if kw in text_lower:
            risk_level = 3
            signs.append(f"Обнаружено: '{kw}'")
    labels = ["Безопасно", "Подозрительно", "Опасно", "Мошенники!"]
    return {"risk_level": risk_level, "risk_label": labels[min(risk_level, 3)], "signs": signs, "summary": "СТОП! Мошенники!" if risk_level == 3 else "Проверьте ещё раз", "action": "Заблокируйте отправителя" if risk_level == 3 else "Будьте осторожны"}

@app.get("/news")
async def get_news():
    return [
        {"title": "Мошенники звонят от имени банков", "content": "Участились случаи звонков мошенников, представляющихся сотрудниками банков. Никогда не сообщайте код из СМС!", "type": "danger", "source": "МВД России", "timestamp": "2026-05-10"},
        {"title": "Новые льготы для пенсионеров", "content": "С июня 2026 года пенсионеры старше 70 лет получат дополнительную выплату 5000 рублей. Оформить можно в МФЦ.", "type": "benefit", "source": "Пенсионный фонд России", "timestamp": "2026-05-09"},
        {"title": "Как не попасться на фишинг", "content": "Мошенники создают сайты-копии банков. Всегда проверяйте адрес сайта в браузере перед вводом данных.", "type": "danger", "source": "Банк России", "timestamp": "2026-05-08"},
        {"title": "Бесплатная диспансеризация", "content": "До конца года все граждане могут пройти бесплатную диспансеризацию в поликлинике по месту прописки.", "type": "benefit", "source": "Минздрав России", "timestamp": "2026-05-07"},
        {"title": "Осторожно: фальшивые сайты госуслуг", "content": "Появились поддельные сайты Госуслуг. Настоящий адрес только gosuslugi.ru!", "type": "danger", "source": "Госуслуги", "timestamp": "2026-05-06"}
    ]

@app.get("/sites")
async def get_sites():
    return [
        {"name": "Госуслуги", "url": "https://gosuslugi.ru", "description": "Государственные услуги онлайн", "emoji": "🏛"},
        {"name": "Пенсионный фонд", "url": "https://sfr.gov.ru", "description": "Социальный фонд России", "emoji": "👴"},
        {"name": "МФЦ", "url": "https://mfc.ru", "description": "Мои документы — центр услуг", "emoji": "📋"},
        {"name": "Банк России", "url": "https://cbr.ru", "description": "Центральный банк — проверка банков", "emoji": "🏦"},
        {"name": "МВД", "url": "https://mvd.ru", "description": "Сообщить о мошенниках", "emoji": "👮"},
        {"name": "Минздрав", "url": "https://minzdrav.gov.ru", "description": "Здоровье и медицина", "emoji": "🏥"},
        {"name": "ФНС", "url": "https://nalog.gov.ru", "description": "Федеральная налоговая служба", "emoji": "📊"},
        {"name": "Стоп мошенник", "url": "https://stopmoscam.ru", "description": "Официальный портал против мошенников", "emoji": "🛡"}
    ]

app.mount("/", StaticFiles(directory=".", html=True), name="static")
