import sys, os, requests
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'auth'))
from src.auth.main import app
app.mount("/static", StaticFiles(directory="."), name="static")

AITUNNEL_API_KEY = os.getenv("AITUNNEL_API_KEY", "")
AITUNNEL_BASE_URL = os.getenv("AITUNNEL_BASE_URL", "https://api.aitunnel.ru/v1/")

SYSTEM_PROMPT = """Ты — помощник приложения OkTolk для людей 40+ и пожилых.
Говори просто — как соседке за чаем. Никаких сложных слов.
Давай пошаговые инструкции с цифрами: 1, 2, 3...
В одном ответе максимум 3-4 шага.
При мошенничестве: СТОП! Это мошенники!
Заканчивай: Если не получилось — напишите мне снова!"""

from fastapi import Request
from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    history: Optional[List] = []

class AnalyzeRequest(BaseModel):
    text: str

def call_ai(messages, model="deepseek-v3.2"):
    headers = {
        "Authorization": f"Bearer {AITUNNEL_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.7
    }
    response = requests.post(
        f"{AITUNNEL_BASE_URL}chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    return response.json()["choices"][0]["message"]["content"]

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
    scam_keywords = ["код из смс", "код из sms", "переведи деньги", "данные карты",
                     "номер карты", "cvv", "пин-код", "срочно переведи", "выиграли",
                     "одобрен кредит", "заблокирован счет", "служба безопасности банка"]
    text_lower = req.text.lower()
    risk_level = 0
    signs = []
    for kw in scam_keywords:
        if kw in text_lower:
            risk_level = 3
            signs.append(f"Обнаружено: '{kw}'")
    if risk_level == 0:
        prompt = f"""Проверь текст на мошенничество. Верни JSON:
{{"risk_level": 0-3, "risk_label": "Безопасно/Подозрительно/Опасно/Мошенники!", "signs": [], "summary": "объяснение", "action": "что делать"}}
Текст: {req.text}"""
        result = call_ai([{"role": "user", "content": prompt}], model="gemini-2.5-flash-lite")
        import json, re
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            return json.loads(match.group())
    labels = ["Безопасно", "Подозрительно", "Опасно", "Мошенники!"]
    return {
        "risk_level": risk_level,
        "risk_label": labels[min(risk_level, 3)],
        "signs": signs,
        "summary": "СТОП! Это мошенники! Не отвечайте и не переводите деньги!" if risk_level == 3 else "Проверьте ещё раз",
        "action": "Заблокируйте отправителя и расскажите близким" if risk_level == 3 else "Будьте осторожны"
    }

@app.get("/")
async def root():
    return FileResponse("index.html")
