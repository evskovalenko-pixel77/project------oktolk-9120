import sys, os, requests, json, re, hashlib, secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncpg

# ── Auth app import ──────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'auth'))
from src.auth.main import app

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Env ──────────────────────────────────────────────────────────
AITUNNEL_API_KEY  = os.getenv("AITUNNEL_API_KEY", "")
AITUNNEL_BASE_URL = os.getenv("AITUNNEL_BASE_URL", "https://api.aitunnel.ru/v1/")
SECRET_KEY        = os.getenv("SECRET_KEY", "oktolk-super-secret-key-2026-production")

DB_HOST = os.getenv("DB_HOST", "amvera-kes-cnpg-oktolk-db-rw")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "oktolk")
DB_USER = os.getenv("DB_USER", "oktolk_user")
DB_PASS = os.getenv("DB_PASS", "")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ── DB pool ──────────────────────────────────────────────────────
db_pool = None

async def get_db():
    return await db_pool.acquire()

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        await init_db()
        print("✅ PostgreSQL connected")
    except Exception as e:
        print(f"⚠️ PostgreSQL not available: {e}")

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()

async def init_db():
    async with db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          SERIAL PRIMARY KEY,
                phone       VARCHAR(20) UNIQUE NOT NULL,
                name        VARCHAR(100),
                password_hash VARCHAR(200),
                created_at  TIMESTAMP DEFAULT NOW(),
                tariff      VARCHAR(20) DEFAULT 'demo',
                tariff_until TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token       VARCHAR(200) PRIMARY KEY,
                user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at  TIMESTAMP DEFAULT NOW(),
                expires_at  TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS health_records (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type        VARCHAR(20),
                value_1     FLOAT,
                value_2     FLOAT,
                comment     TEXT,
                recorded_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS medications (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name        VARCHAR(200),
                dose        VARCHAR(100),
                schedule    VARCHAR(100),
                start_date  DATE,
                end_date    DATE,
                is_active   BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS finance_records (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category    VARCHAR(50),
                amount      FLOAT,
                comment     TEXT,
                recorded_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS features (
                name        VARCHAR(50) PRIMARY KEY,
                enabled     BOOLEAN DEFAULT FALSE,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS error_logs (
                id          SERIAL PRIMARY KEY,
                error       TEXT,
                created_at  TIMESTAMP DEFAULT NOW()
            );
        """)

        # Insert default feature flags
        await conn.execute("""
            INSERT INTO features (name, enabled, description) VALUES
                ('health_module',  FALSE, 'Раздел Моё здоровье'),
                ('finance_module', FALSE, 'Раздел Мои финансы'),
                ('telegram_bot',   FALSE, 'Напоминания через Telegram'),
                ('max_bot',        FALSE, 'Напоминания через Макс'),
                ('subscription',   FALSE, 'Платная подписка ЮKassa'),
                ('new_nav',        FALSE, 'Новая навигация v2')
            ON CONFLICT (name) DO NOTHING;
        """)

# ── Auth helpers ─────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Не авторизован")
    token = authorization.split(" ")[1]
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT user_id FROM sessions WHERE token=$1 AND expires_at > NOW()", token
        )
        if not session:
            raise HTTPException(status_code=401, detail="Токен истёк или неверный")
        user = await conn.fetchrow("SELECT * FROM users WHERE id=$1", session["user_id"])
        return dict(user)

# ── Models ───────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    phone: str
    name: str
    password: str

class LoginRequest(BaseModel):
    phone: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List] = []

class AnalyzeRequest(BaseModel):
    text: str

class HealthRecordRequest(BaseModel):
    type: str        # pressure / pulse / sugar / note
    value_1: Optional[float] = None
    value_2: Optional[float] = None
    comment: Optional[str] = None

class MedicationRequest(BaseModel):
    name: str
    dose: str
    schedule: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class FinanceRecordRequest(BaseModel):
    category: str   # pharmacy / shop / utility / credit / other
    amount: float
    comment: Optional[str] = None

# ── AI helper ────────────────────────────────────────────────────
SYSTEM_PROMPT = """Ты помощник OkTolk. Говори просто, без сложных слов.
Каждый шаг с новой строки, нумеруй: 1. 2. 3.
Максимум 3-4 шага в ответе.
НЕ используй ** ## --- и другую разметку.
Если спрашивают про мошенников: СТОП! Это мошенники! Не отвечайте им!
Заканчивай: Если не получилось - напишите мне снова!"""

def call_ai(messages, model="deepseek-v3.2"):
    headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
    data = {"model": model, "messages": messages, "max_tokens": 500, "temperature": 0.7}
    response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
    return response.json()["choices"][0]["message"]["content"]

# ── API v1 ───────────────────────────────────────────────────────

# Auth
@app.post("/api/v1/auth/register")
async def register(req: RegisterRequest):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM users WHERE phone=$1", req.phone)
        if existing:
            raise HTTPException(status_code=400, detail="Телефон уже зарегистрирован")
        user_id = await conn.fetchval(
            "INSERT INTO users (phone, name, password_hash) VALUES ($1,$2,$3) RETURNING id",
            req.phone, req.name, hash_password(req.password)
        )
        token = generate_token()
        expires = datetime.now() + timedelta(days=30)
        await conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)",
            token, user_id, expires
        )
        return {"token": token, "user_id": user_id, "name": req.name, "tariff": "demo"}

@app.post("/api/v1/auth/login")
async def login(req: LoginRequest):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE phone=$1 AND password_hash=$2",
            req.phone, hash_password(req.password)
        )
        if not user:
            raise HTTPException(status_code=401, detail="Неверный телефон или пароль")
        token = generate_token()
        expires = datetime.now() + timedelta(days=30)
        await conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)",
            token, user["id"], expires
        )
        return {"token": token, "user_id": user["id"], "name": user["name"], "tariff": user["tariff"]}

@app.get("/api/v1/auth/me")
async def me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "phone": user["phone"], "tariff": user["tariff"]}

# Feature Flags
@app.get("/api/v1/features")
async def get_features():
    if not db_pool:
        return {"features": []}
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT name FROM features WHERE enabled=TRUE")
        return {"features": [r["name"] for r in rows]}

# Chat (без авторизации — публичный)
@app.post("/api/v1/chat")
async def chat_v1(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in req.history[-10:]:
        messages.append(h)
    messages.append({"role": "user", "content": req.message})
    reply = call_ai(messages)
    return {"reply": reply}

# Antiscam
@app.post("/api/v1/analyze/text")
async def analyze_v1(req: AnalyzeRequest):
    scam_keywords = ["код из смс", "переведи деньги", "данные карты", "номер карты", "cvv", "пин-код", "срочно переведи", "выиграли", "одобрен кредит", "заблокирован счет"]
    text_lower = req.text.lower()
    risk_level = 0
    signs = []
    for kw in scam_keywords:
        if kw in text_lower:
            risk_level = 3
            signs.append(f"Обнаружено: '{kw}'")
    labels = ["Безопасно", "Подозрительно", "Опасно", "Мошенники!"]
    return {"risk_level": risk_level, "risk_label": labels[min(risk_level, 3)], "signs": signs,
            "summary": "СТОП! Мошенники!" if risk_level == 3 else "Проверьте ещё раз",
            "action": "Заблокируйте отправителя" if risk_level == 3 else "Будьте осторожны"}

# Health
@app.get("/api/v1/health/records")
async def get_health_records(user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM health_records WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 50",
            user["id"]
        )
        return [dict(r) for r in rows]

@app.post("/api/v1/health/records")
async def add_health_record(req: HealthRecordRequest, user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        row_id = await conn.fetchval(
            "INSERT INTO health_records (user_id, type, value_1, value_2, comment) VALUES ($1,$2,$3,$4,$5) RETURNING id",
            user["id"], req.type, req.value_1, req.value_2, req.comment
        )
        return {"id": row_id, "status": "ok"}

@app.get("/api/v1/health/meds")
async def get_medications(user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM medications WHERE user_id=$1 AND is_active=TRUE ORDER BY id",
            user["id"]
        )
        return [dict(r) for r in rows]

@app.post("/api/v1/health/meds")
async def add_medication(req: MedicationRequest, user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        row_id = await conn.fetchval(
            "INSERT INTO medications (user_id, name, dose, schedule, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
            user["id"], req.name, req.dose, req.schedule,
            req.start_date, req.end_date
        )
        return {"id": row_id, "status": "ok"}

# Finance
@app.get("/api/v1/finance/records")
async def get_finance_records(user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM finance_records WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 100",
            user["id"]
        )
        return [dict(r) for r in rows]

@app.post("/api/v1/finance/records")
async def add_finance_record(req: FinanceRecordRequest, user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        row_id = await conn.fetchval(
            "INSERT INTO finance_records (user_id, category, amount, comment) VALUES ($1,$2,$3,$4) RETURNING id",
            user["id"], req.category, req.amount, req.comment
        )
        return {"id": row_id, "status": "ok"}

@app.get("/api/v1/finance/summary")
async def get_finance_summary(user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM finance_records
            WHERE user_id=$1
            AND recorded_at >= date_trunc('month', NOW())
            GROUP BY category
        """, user["id"])
        return {"month": datetime.now().strftime("%Y-%m"), "categories": [dict(r) for r in rows]}

# ── Legacy endpoints (backward compat) ──────────────────────────
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
    return await analyze_v1(req)

@app.get("/news")
async def get_news():
    return [
        {"title": "Мошенники звонят от имени банков", "content": "Участились случаи звонков мошенников, представляющихся сотрудниками банков. Никогда не сообщайте код из СМС!", "type": "danger", "source": "МВД России", "url": "https://mvd.ru", "timestamp": "2026-05-10"},
        {"title": "Новые льготы для пенсионеров", "content": "С июня 2026 года пенсионеры старше 70 лет получат дополнительную выплату 5000 рублей.", "type": "benefit", "source": "Пенсионный фонд России", "url": "https://sfr.gov.ru", "timestamp": "2026-05-09"},
        {"title": "Как не попасться на фишинг", "content": "Мошенники создают сайты-копии банков. Всегда проверяйте адрес сайта в браузере.", "type": "danger", "source": "Банк России", "url": "https://cbr.ru", "timestamp": "2026-05-08"},
        {"title": "Бесплатная диспансеризация", "content": "До конца года все граждане могут пройти бесплатную диспансеризацию в поликлинике.", "type": "benefit", "source": "Минздрав России", "url": "https://minzdrav.gov.ru", "timestamp": "2026-05-07"},
        {"title": "Осторожно: фальшивые сайты госуслуг", "content": "Появились поддельные сайты Госуслуг. Настоящий адрес только gosuslugi.ru!", "type": "danger", "source": "Госуслуги", "url": "https://gosuslugi.ru", "timestamp": "2026-05-06"}
    ]

@app.get("/sites")
async def get_sites():
    return [
        {"name": "Госуслуги", "url": "https://gosuslugi.ru", "description": "Государственные услуги онлайн"},
        {"name": "Пенсионный фонд", "url": "https://sfr.gov.ru", "description": "Социальный фонд России"},
        {"name": "МФЦ", "url": "https://mfc.ru", "description": "Мои документы — центр услуг"},
        {"name": "Банк России", "url": "https://cbr.ru", "description": "Центральный банк — проверка банков"},
        {"name": "МВД", "url": "https://mvd.ru", "description": "Сообщить о мошенниках"},
        {"name": "Минздрав", "url": "https://minzdrav.gov.ru", "description": "Здоровье и медицина"},
        {"name": "ФНС", "url": "https://nalog.gov.ru", "description": "Федеральная налоговая служба"}
    ]

app.mount("/", StaticFiles(directory=".", html=True), name="static")
