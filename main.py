import sys, os, requests, json, re, hashlib, secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Header, Request
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
YANDEX_API_KEY    = os.getenv("YANDEX_API_KEY", "")
DEEPSEEK_API_KEY  = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/"
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
                tariff_until TIMESTAMP,
                marketing_consent BOOLEAN DEFAULT FALSE,
                is_demo     BOOLEAN DEFAULT FALSE
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

            CREATE TABLE IF NOT EXISTS user_profile (
                user_id     INTEGER PRIMARY KEY,
                gender      VARCHAR(10),
                age         INTEGER,
                height      INTEGER,
                weight      REAL,
                profession  TEXT,
                hobbies     TEXT,
                work_pressure_1 INTEGER,
                work_pressure_2 INTEGER,
                work_pulse  INTEGER,
                base_sugar  REAL,
                habits      TEXT,
                activity    VARCHAR(20),
                alcohol     INTEGER DEFAULT 0,
                smoking     INTEGER DEFAULT 0,
                smoking_years INTEGER,
                heredity    TEXT,
                chronic     TEXT,
                income      REAL,
                updated_at  TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS credits (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                name        TEXT,
                amount      REAL,
                rate        REAL,
                term_months INTEGER,
                monthly_payment REAL,
                notes       TEXT,
                created_at  TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS loans (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                name        TEXT,
                amount      REAL,
                due_date    TEXT,
                monthly_payment REAL,
                notes       TEXT,
                created_at  TIMESTAMP DEFAULT NOW()
            );
        """)

        # Миграции для существующих таблиц (CREATE IF NOT EXISTS не добавляет колонки)
        await conn.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(40);
            ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS alcohol INTEGER DEFAULT 0;
            ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS smoking INTEGER DEFAULT 0;
            ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS smoking_years INTEGER;
            ALTER TABLE loans ADD COLUMN IF NOT EXISTS monthly_payment REAL;
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
    marketing_consent: bool = False

class LoginRequest(BaseModel):
    phone: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List] = []
    system: Optional[str] = None
    mode: Optional[str] = None

class AnalyzeRequest(BaseModel):
    text: str
    context: Optional[str] = None

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

HEALTH_PROMPT = """Ты — грамотный помощник по здоровью в приложении OkTolk.
Отвечай как знающий человек, который умеет объяснять сложное простым языком — живо, по-человечески, без болтовни.

Правила:
— Коротко и по делу: 2-5 предложений для простых вопросов.
— Объясняй понятно, как образованный собеседник, а не сухая инструкция.
— Если перечисляешь — каждый пункт с новой строки, начинай с «— ».
— Не ставь диагнозы, не назначай лекарства и дозировки.
— При тревожных симптомах мягко советуй обратиться к врачу.
— Не используй ** ## и markdown-разметку, пиши обычным текстом.
— Опирайся на проверенную медицинскую информацию.

Если предоставлены данные пользователя — обязательно учитывай их:
— Рабочее давление — это его личная норма, сравнивай измерения с ней, а не только с общей нормой.
— Учитывай возраст, вредные привычки, физическую активность при оценке показателей.
— Если пользователь курит или употребляет алкоголь — можешь мягко упомянуть связь с показателями, без нравоучений.
— Профессию и хобби используй чтобы ответ был ближе к его жизни (например, «для водителя важно следить за давлением»).
— Не пересказывай все данные пользователя обратно — просто используй их в ответе."""

SYSTEM_PROMPTS = {
    "health": HEALTH_PROMPT,
}

def call_ai(messages, model="deepseek-chat"):
    # Пробуем AItunnel (основной), при ошибке — DeepSeek напрямую
    try:
        if AITUNNEL_API_KEY:
            headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
            data = {"model": "deepseek-v4-flash", "messages": messages, "max_tokens": 800, "temperature": 0.7}
            response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
    except Exception:
        pass
    # Fallback — DeepSeek напрямую
    if DEEPSEEK_API_KEY:
        headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
        data = {"model": "deepseek-chat", "messages": messages, "max_tokens": 800}
        response = requests.post("https://api.deepseek.com/v1/chat/completions", headers=headers, json=data, timeout=30)
        return response.json()["choices"][0]["message"]["content"]
    raise Exception("AI недоступен: нет рабочих API ключей")

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
            "INSERT INTO users (phone, name, password_hash, marketing_consent) VALUES ($1,$2,$3,$4) RETURNING id",
            req.phone, req.name, hash_password(req.password), req.marketing_consent
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

@app.post("/api/v1/auth/demo")
async def auth_demo():
    """Создать анонимного демо-пользователя без персональных данных и выдать токен"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")

    # Гарантируем наличие колонки is_demo и расширяем phone (миграция)
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE")
            await conn.execute("ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(40)")
    except Exception:
        pass

    # Создаём пользователя в чистом соединении (телефон <= 20 символов на всякий случай)
    demo_phone = "d_" + secrets.token_hex(6)
    async with db_pool.acquire() as conn:
        user_id = await conn.fetchval(
            "INSERT INTO users (phone, name, password_hash, tariff, is_demo) VALUES ($1,$2,$3,$4,$5) RETURNING id",
            demo_phone, "Гость", "demo_no_password", "demo", True
        )
        token = generate_token()
        expires = datetime.now() + timedelta(days=90)
        await conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)",
            token, user_id, expires
        )
    return {"token": token, "user_id": user_id, "name": "Гость", "tariff": "demo", "is_demo": True}

# Feature Flags
@app.get("/api/v1/features")
async def get_features():
    if not db_pool:
        return {"features": []}
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT name FROM features WHERE enabled=TRUE")
        return {"features": [r["name"] for r in rows]}

async def build_profile_context(user_id: int) -> str:
    """Строит текстовый контекст профиля пользователя для AI"""
    if not db_pool:
        return ""
    try:
        async with db_pool.acquire() as conn:
            p = await conn.fetchrow("SELECT * FROM user_profile WHERE user_id=$1", user_id)
        if not p:
            return ""
        parts = []
        if p.get("age"):
            parts.append(f"Возраст: {p['age']} лет")
        if p.get("gender"):
            parts.append(f"Пол: {'мужской' if p['gender'] == 'м' else 'женский'}")
        if p.get("height") and p.get("weight"):
            parts.append(f"Рост: {p['height']} см, вес: {p['weight']} кг")
        elif p.get("height"):
            parts.append(f"Рост: {p['height']} см")
        elif p.get("weight"):
            parts.append(f"Вес: {p['weight']} кг")
        if p.get("profession"):
            parts.append(f"Профессия: {p['profession']}")
        if p.get("hobbies"):
            parts.append(f"Хобби и интересы: {p['hobbies']}")
        if p.get("work_pressure_1") and p.get("work_pressure_2"):
            parts.append(f"Рабочее (нормальное) давление: {p['work_pressure_1']}/{p['work_pressure_2']} мм рт.ст.")
        if p.get("work_pulse"):
            parts.append(f"Обычный пульс: {p['work_pulse']} уд/мин")
        if p.get("base_sugar"):
            parts.append(f"Базовый сахар: {p['base_sugar']} ммоль/л")
        alcohol_labels = ["не употребляет алкоголь", "употребляет раз в месяц или реже",
                          "употребляет 2-4 раза в месяц", "употребляет 2-3 раза в неделю",
                          "употребляет 4+ раза в неделю"]
        smoke_labels = ["не курит", "курит до 5 сигарет в день", "курит около 10 сигарет в день",
                        "курит около 15 сигарет в день", "курит 20+ сигарет в день"]
        alc = p.get("alcohol", 0) or 0
        smk = p.get("smoking", 0) or 0
        if alc > 0:
            parts.append(f"Алкоголь: {alcohol_labels[min(alc, 4)]}")
        if smk > 0:
            label = smoke_labels[min(smk, 4)]
            stazh = p.get("smoking_years")
            parts.append(f"Курение: {label}" + (f", стаж {stazh} лет" if stazh else ""))
        if alc == 0 and smk == 0:
            parts.append("Вредные привычки: нет")
        activity_map = {"низкая": "низкая физическая активность", "средняя": "средняя физическая активность", "высокая": "высокая физическая активность"}
        if p.get("activity"):
            parts.append(f"Физическая активность: {activity_map.get(p['activity'], p['activity'])}")
        if p.get("heredity"):
            parts.append(f"Наследственность: {p['heredity']}")
        if p.get("chronic"):
            parts.append(f"Хронические заболевания: {p['chronic']}")
        if p.get("income"):
            parts.append(f"Ежемесячный доход: {int(p['income'])} руб.")
        if not parts:
            return ""
        return "\n\nДанные пользователя (используй для персонального ответа):\n" + "\n".join(f"— {x}" for x in parts)
    except Exception:
        return ""

# Chat (с опциональной авторизацией — берём профиль если токен есть)
@app.post("/api/v1/chat")
async def chat_v1(req: ChatRequest, request: Request):
    try:
        # Получаем user_id из токена если он есть
        user_id = None
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
            if token and token not in ("demo", "local_demo", ""):
                if db_pool:
                    async with db_pool.acquire() as conn:
                        row = await conn.fetchrow(
                            "SELECT user_id FROM sessions WHERE token=$1 AND expires_at > NOW()", token
                        )
                        if row:
                            user_id = row["user_id"]
        except Exception:
            pass

        # Строим системный промпт с профилем
        base_prompt = req.system or SYSTEM_PROMPTS.get(req.mode or "", SYSTEM_PROMPT)
        profile_ctx = await build_profile_context(user_id) if user_id else ""
        sys_prompt = base_prompt + profile_ctx

        messages = [{"role": "system", "content": sys_prompt}]
        for h in req.history[-10:]:
            messages.append(h)
        messages.append({"role": "user", "content": req.message})
        reply = call_ai(messages)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI недоступен: {str(e)}")

# Antiscam
@app.post("/api/v1/analyze/text")
async def analyze_v1(req: AnalyzeRequest):
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        prompt = f"""Ты антискам система OkTolk. Анализируй внутри себя, показывай только краткий результат.

ПРАВИЛА:
- Не описывай что видишь на скриншоте
- Не пересказывай переписку
- Только вердикт и рекомендации
- Простой язык без терминов

АНАЛИЗИРУЙ ВНУТРИ: тип схемы, психологические триггеры, технические признаки, логические противоречия

ПРЕДЫДУЩИЙ КОНТЕКСТ (учти при анализе):
{req.context if req.context else "нет"}

ТЕКСТ ДЛЯ АНАЛИЗА:
{req.text}

Ответь ТОЛЬКО JSON:
{{"risk_level": 0, "summary": "1 предложение - суть угрозы или её отсутствия", "how_they_manipulate": "как пытаются обмануть или null", "consequences": "к чему может привести или null", "recommendation": "одно конкретное действие"}}

ШКАЛА: 0=безопасно 1=минимальный 2=подозрения 3=высокий 4=очень высокий 5=явное мошенничество
Только JSON, никакого текста до или после.
"""

        headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
        data = {
            "model": "gemini-2.5-flash-lite",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500
        }
        response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
        result = response.json()
        text = result["choices"][0]["message"]["content"].strip()

        # Чистим JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
        else:
            parsed = json.loads(text)

        return parsed
    except Exception as e:
        # Fallback на ключевые слова
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

# ── User Profile ─────────────────────────────────────────────────

class ProfileRequest(BaseModel):
    user_id: Optional[int] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[int] = None
    weight: Optional[float] = None
    profession: Optional[str] = None
    hobbies: Optional[str] = None
    work_pressure_1: Optional[int] = None
    work_pressure_2: Optional[int] = None
    work_pulse: Optional[int] = None
    base_sugar: Optional[float] = None
    habits: Optional[str] = None
    activity: Optional[str] = None
    alcohol: Optional[int] = 0
    smoking: Optional[int] = 0
    smoking_years: Optional[int] = None
    heredity: Optional[str] = None
    chronic: Optional[str] = None
    income: Optional[float] = None

@app.get("/api/v1/profile")
async def get_profile(user=Depends(get_current_user)):
    """Получить профиль текущего пользователя (user_id из токена)"""
    if not db_pool:
        return {}
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM user_profile WHERE user_id=$1", user["id"])
        return dict(row) if row else {}

@app.post("/api/v1/profile")
async def save_profile(req: ProfileRequest, user=Depends(get_current_user)):
    """Сохранить/обновить профиль (upsert) — user_id из токена"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    uid = user["id"]
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO user_profile
                (user_id, gender, age, height, weight, profession, hobbies,
                 work_pressure_1, work_pressure_2, work_pulse, base_sugar,
                 habits, activity, alcohol, smoking, smoking_years, heredity, chronic, income, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                gender=$2, age=$3, height=$4, weight=$5, profession=$6, hobbies=$7,
                work_pressure_1=$8, work_pressure_2=$9, work_pulse=$10, base_sugar=$11,
                habits=$12, activity=$13, alcohol=$14, smoking=$15, smoking_years=$16,
                heredity=$17, chronic=$18, income=$19, updated_at=NOW()
        """, uid, req.gender, req.age, req.height, req.weight, req.profession,
            req.hobbies, req.work_pressure_1, req.work_pressure_2, req.work_pulse,
            req.base_sugar, req.habits, req.activity, req.alcohol, req.smoking,
            req.smoking_years, req.heredity, req.chronic, req.income)
        return {"status": "ok"}

# ── Credits & Loans ──────────────────────────────────────────────

class CreditRequest(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    rate: Optional[float] = None
    term_months: Optional[int] = None
    monthly_payment: Optional[float] = None
    notes: Optional[str] = None

class LoanRequest(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[str] = None
    monthly_payment: Optional[float] = None
    notes: Optional[str] = None

@app.get("/api/v1/credits")
async def get_credits(user=Depends(get_current_user)):
    if not db_pool:
        return []
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM credits WHERE user_id=$1 ORDER BY created_at DESC", user["id"])
        return [dict(r) for r in rows]

@app.post("/api/v1/credits")
async def add_credit(req: CreditRequest, user=Depends(get_current_user)):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    uid = user["id"]
    async with db_pool.acquire() as conn:
        if req.id:
            await conn.execute("""
                UPDATE credits SET name=$2, amount=$3, rate=$4, term_months=$5, monthly_payment=$6, notes=$7
                WHERE id=$1 AND user_id=$8
            """, req.id, req.name, req.amount, req.rate, req.term_months, req.monthly_payment, req.notes, uid)
            return {"id": req.id, "status": "ok"}
        row = await conn.fetchrow("""
            INSERT INTO credits (user_id, name, amount, rate, term_months, monthly_payment, notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
        """, uid, req.name, req.amount, req.rate, req.term_months, req.monthly_payment, req.notes)
        return {"id": row["id"], "status": "ok"}

@app.delete("/api/v1/credits/{credit_id}")
async def delete_credit(credit_id: int, user=Depends(get_current_user)):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        await conn.execute("DELETE FROM credits WHERE id=$1 AND user_id=$2", credit_id, user["id"])
        return {"status": "ok"}

@app.get("/api/v1/loans")
async def get_loans(user=Depends(get_current_user)):
    if not db_pool:
        return []
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM loans WHERE user_id=$1 ORDER BY created_at DESC", user["id"])
        return [dict(r) for r in rows]

@app.post("/api/v1/loans")
async def add_loan(req: LoanRequest, user=Depends(get_current_user)):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    uid = user["id"]
    async with db_pool.acquire() as conn:
        if req.id:
            await conn.execute("""
                UPDATE loans SET name=$2, amount=$3, due_date=$4, monthly_payment=$5, notes=$6
                WHERE id=$1 AND user_id=$7
            """, req.id, req.name, req.amount, req.due_date, req.monthly_payment, req.notes, uid)
            return {"id": req.id, "status": "ok"}
        row = await conn.fetchrow("""
            INSERT INTO loans (user_id, name, amount, due_date, monthly_payment, notes)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
        """, uid, req.name, req.amount, req.due_date, req.monthly_payment, req.notes)
        return {"id": row["id"], "status": "ok"}

@app.delete("/api/v1/loans/{loan_id}")
async def delete_loan(loan_id: int, user=Depends(get_current_user)):
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        await conn.execute("DELETE FROM loans WHERE id=$1 AND user_id=$2", loan_id, user["id"])
        return {"status": "ok"}

# ── Health ───────────────────────────────────────────────────────

class HealthParseRequest(BaseModel):
    user_id: Optional[int] = None  # берётся из токена, не нужен в теле
    type: str
    image_base64: Optional[str] = None
    mime_type: str = "image/jpeg"
    text: Optional[str] = None

class HealthRecordCreateRequest(BaseModel):
    user_id: Optional[int] = None  # берётся из токена
    type: str
    value_1: float
    value_2: Optional[float] = None
    comment: Optional[str] = None

@app.get("/api/v1/health/records")
async def get_health_records(
    type: Optional[str] = None,
    days: int = 30,
    limit: int = 100,
    user=Depends(get_current_user)
):
    """Записи здоровья текущего пользователя (user_id из токена)"""
    if not db_pool:
        return []
    uid = user["id"]
    async with db_pool.acquire() as conn:
        if type:
            rows = await conn.fetch("""
                SELECT id, user_id, type, value_1, value_2, comment, recorded_at
                FROM health_records
                WHERE user_id=$1
                  AND type=$2
                  AND recorded_at >= NOW() - make_interval(days => $3)
                ORDER BY recorded_at DESC
                LIMIT $4
            """, uid, type, days, limit)
        else:
            rows = await conn.fetch("""
                SELECT id, user_id, type, value_1, value_2, comment, recorded_at
                FROM health_records
                WHERE user_id=$1
                  AND recorded_at >= NOW() - make_interval(days => $2)
                ORDER BY recorded_at DESC
                LIMIT $3
            """, uid, days, limit)
        return [dict(r) for r in rows]

@app.post("/api/v1/health/records")
async def add_health_record_public(req: HealthRecordCreateRequest, user=Depends(get_current_user)):
    """Добавить показатель здоровья (user_id из токена)"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="БД недоступна")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO health_records (user_id, type, value_1, value_2, comment)
               VALUES ($1,$2,$3,$4,$5) RETURNING id, recorded_at""",
            user["id"], req.type, req.value_1, req.value_2, req.comment
        )
        return {"id": row["id"], "recorded_at": str(row["recorded_at"]), "status": "ok"}

@app.post("/api/v1/health/parse")
async def parse_health_photo(req: HealthParseRequest, user=Depends(get_current_user)):
    """AI распознавание показателя из фото (тонометр, весы, глюкометр) или текста"""
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")

    # Описание что извлекаем — работает и для фото, и для текста
    type_desc = {
        "pressure": 'показатели артериального давления. value_1 = верхнее (систолическое), value_2 = нижнее (диастолическое)',
        "pulse":    'частоту пульса. value_1 = пульс в уд/мин, value_2 = null',
        "sugar":    'уровень сахара в крови. value_1 = ммоль/л, value_2 = null',
        "weight":   'вес тела. value_1 = вес в кг, value_2 = null',
    }
    desc = type_desc.get(req.type, type_desc["pressure"])

    source = "на фото (тонометр/весы/глюкометр/прибор)" if req.image_base64 else "из текста пользователя"
    prompt = (
        f'Извлеки {source} {desc}. '
        f'Если пользователь описал самочувствие или причину (стресс, нагрузка, после еды и т.п.) — добавь это в comment, иначе comment = краткое описание. '
        f'Верни ТОЛЬКО валидный JSON без пояснений: '
        f'{{"value_1": число, "value_2": число или null, "comment": "текст"}}'
    )

    try:
        headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}

        if req.image_base64:
            messages = [{"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:{req.mime_type};base64,{req.image_base64}"}},
                {"type": "text", "text": prompt}
            ]}]
        else:
            messages = [{"role": "user", "content": f"{prompt}\n\nТекст пользователя: {req.text}"}]

        data = {"model": "gemini-2.5-flash-lite", "messages": messages, "max_tokens": 200}
        response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
        result_text = response.json()["choices"][0]["message"]["content"].strip()

        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if not json_match:
            raise HTTPException(status_code=422, detail="Не удалось распознать показатель")

        parsed = json.loads(json_match.group())
        if parsed.get("value_1") is None:
            raise HTTPException(status_code=422, detail="Значение не найдено")

        # Дефолтный комментарий — исходный текст пользователя (если был)
        default_comment = req.text if req.text else "с фото"

        # Сохраняем в БД
        if db_pool:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """INSERT INTO health_records (user_id, type, value_1, value_2, comment)
                       VALUES ($1,$2,$3,$4,$5) RETURNING id, recorded_at""",
                    user["id"], req.type,
                    float(parsed["value_1"]),
                    float(parsed["value_2"]) if parsed.get("value_2") is not None else None,
                    parsed.get("comment") or default_comment
                )
                parsed["id"] = row["id"]
                parsed["recorded_at"] = str(row["recorded_at"])
                parsed["status"] = "ok"

        return parsed

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка распознавания: {str(e)}")

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
async def get_finance_records(category: Optional[str] = None, user=Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        if category:
            rows = await conn.fetch(
                "SELECT * FROM finance_records WHERE user_id=$1 AND category=$2 ORDER BY recorded_at DESC LIMIT 100",
                user["id"], category
            )
        else:
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
    sys_prompt = req.system or SYSTEM_PROMPTS.get(req.mode or "", SYSTEM_PROMPT)
    messages = [{"role": "system", "content": sys_prompt}]
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


import base64

# ── STT (Speech-to-Text) ─────────────────────────────────────────
class STTRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"

@app.post("/api/v1/stt")
async def speech_to_text(req: STTRequest):
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        headers = {
            "Authorization": f"Bearer {AITUNNEL_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gemini-2.5-flash-lite",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": req.audio_base64,
                                "format": "webm"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Транскрибируй точно что сказано. Верни только текст, без комментариев."
                        }
                    ]
                }
            ],
            "max_tokens": 500
        }
        response = requests.post(
            f"{AITUNNEL_BASE_URL}chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        result = response.json()
        text = result["choices"][0]["message"]["content"].strip()
        return {"text": text, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка STT: {str(e)}")


# ── TTS (Text-to-Speech) Yandex SpeechKit ───────────────────────
from fastapi.responses import StreamingResponse
import io

class TTSRequest(BaseModel):
    text: str
    voice: str = "alena"

@app.post("/api/v1/tts")
async def text_to_speech(req: TTSRequest):
    if not YANDEX_API_KEY:
        raise HTTPException(status_code=503, detail="Яндекс TTS недоступен")
    try:
        params = {
            "text": req.text[:5000],
            "lang": "ru-RU",
            "voice": req.voice,
            "speed": "1.0",
            "format": "mp3",
            "sampleRateHertz": "48000"
        }
        headers = {
            "Authorization": f"Api-Key {YANDEX_API_KEY}"
        }
        response = requests.post(
            "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
            headers=headers,
            data=params,
            timeout=30
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Ошибка Яндекс TTS: {response.text}")
        return StreamingResponse(
            io.BytesIO(response.content),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка TTS: {str(e)}")

# ── Chat with Image ───────────────────────────────────────────────
class ImageChatRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    context: Optional[str] = None

@app.post("/api/v1/chat/image")
async def chat_with_image(req: ImageChatRequest):
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        headers = {
            "Authorization": f"Bearer {AITUNNEL_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gemini-2.5-flash-lite",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{req.mime_type};base64,{req.image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Извлеки ТОЛЬКО факты из переписки или сообщения на скриншоте. Игнорируй интерфейс приложений и телефона. Анализируй только текст переписки: что предлагают, какие суммы, что просят, какие обещания. Только факты списком."
                        }
                    ]
                }
            ],
            "max_tokens": 500
        }
        response = requests.post(
            f"{AITUNNEL_BASE_URL}chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        result = response.json()
        facts = result["choices"][0]["message"]["content"].strip()

        # Шаг 2 — антискам анализ фактов
        antiscam_data = {
            "model": "gemini-2.5-flash-lite",
            "messages": [{"role": "user", "content": f"""Ты антискам система. Проанализируй факты и дай краткий вердикт.

ФАКТЫ:
{facts}

Ответь ТОЛЬКО JSON:
{{"risk_level": 0, "summary": "1 предложение - есть угроза или нет", "how_they_manipulate": "как пытаются обмануть или null", "consequences": "к чему может привести или null", "recommendation": "одно конкретное действие"}}

ШКАЛА: 0=безопасно 1=минимальный 2=подозрения 3=высокий 4=очень высокий 5=явное мошенничество
Только JSON."""}],
            "max_tokens": 300
        }
        antiscam_response = requests.post(
            f"{AITUNNEL_BASE_URL}chat/completions",
            headers=headers,
            json=antiscam_data,
            timeout=30
        )
        antiscam_result = antiscam_response.json()
        reply_text = antiscam_result["choices"][0]["message"]["content"].strip()

        import re as re2
        json_match = re2.search(r'\{.*\}', reply_text, re2.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed
        return {"reply": reply_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

# ══════════════════════════════════════════════════════
# СТОП МОШЕННИК — антискам модуль
# ══════════════════════════════════════════════════════

class AntiscamExtractRequest(BaseModel):
    """Извлечение фактов из материала"""
    image_base64: Optional[str] = None
    mime_type: str = "image/jpeg"
    audio_base64: Optional[str] = None
    audio_mime: str = "audio/webm"
    url: Optional[str] = None
    text: Optional[str] = None

class AntiscamAnalyzeRequest(BaseModel):
    """Анализ накопленного контекста"""
    facts: str  # все извлечённые факты через \n---\n
    question: Optional[str] = None  # уточняющий вопрос пользователя

def call_gemini_vision(image_base64: str, mime_type: str, prompt: str) -> str:
    """Вызов Gemini с изображением"""
    headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "gemini-2.5-flash-lite",
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}},
            {"type": "text", "text": prompt}
        ]}],
        "max_tokens": 800
    }
    r = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
    return r.json()["choices"][0]["message"]["content"].strip()

def call_gemini_audio(audio_base64: str, mime_type: str) -> str:
    """Транскрипция аудио через Gemini"""
    headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "gemini-2.5-flash-lite",
        "messages": [{"role": "user", "content": [
            {"type": "input_audio", "input_audio": {"data": audio_base64, "format": mime_type.split("/")[-1]}},
            {"type": "text", "text": "Транскрибируй полностью. Раздели реплики по говорящим если их несколько. Верни только текст разговора."}
        ]}],
        "max_tokens": 1000
    }
    r = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=60)
    return r.json()["choices"][0]["message"]["content"].strip()

def call_gemini_text(prompt: str, max_tokens: int = 600) -> str:
    """Вызов Gemini только с текстом"""
    headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "gemini-2.5-flash-lite",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens
    }
    r = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
    return r.json()["choices"][0]["message"]["content"].strip()

EXTRACT_PROMPT = """Ты извлекаешь факты из скриншота переписки или сообщения для анализа на мошенничество.

ВАЖНО: Игнорируй интерфейс приложений, браузеров, телефона — анализируй ТОЛЬКО содержимое переписки или сообщения.
Если на скриншоте видно приложение OkTolk, мессенджер, браузер — анализируй только текст переписки внутри, не сам интерфейс.

Извлеки из переписки/сообщения:
- Что предлагают или просят сделать
- Какие суммы или ценности упоминаются  
- Какие обещания дают
- Какие данные запрашивают (карта, пароль, код из СМС)
- Признаки давления или срочности
- Имена, ники, контакты отправителя
- Ссылки если есть

Если на изображении нет переписки или сообщения — напиши: "Переписка не обнаружена"
Формат: короткий список фактов. Только содержимое переписки."""

@app.post("/api/v1/antiscam/extract")
async def antiscam_extract(req: AntiscamExtractRequest):
    """Этап 1 — извлечение фактов из любого материала"""
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        facts = ""

        if req.image_base64:
            facts = call_gemini_vision(req.image_base64, req.mime_type, EXTRACT_PROMPT)

        elif req.audio_base64:
            transcript = call_gemini_audio(req.audio_base64, req.audio_mime)
            facts = call_gemini_text(f"Из этой транскрипции извлеки факты для анализа на мошенничество:\n{transcript}\n\n{EXTRACT_PROMPT}")

        elif req.url:
            try:
                resp = requests.get(req.url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
                html = resp.text[:5000]
                facts = call_gemini_text(f"Из этого HTML извлеки факты для анализа на мошенничество:\n{html}\n\n{EXTRACT_PROMPT}")
            except:
                facts = f"URL: {req.url} — не удалось загрузить страницу"

        elif req.text:
            facts = req.text

        return {"facts": facts, "status": "ok"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка извлечения: {str(e)}")


ANALYZE_PROMPT = """Ты — антискам система OkTolk. Проанализируй собранные факты и дай структурированный вердикт.

НАКОПЛЕННЫЕ ФАКТЫ ИЗ ВСЕХ МАТЕРИАЛОВ:
{facts}

{question_block}

Найди связи между фактами. Определи схему мошенничества если она есть.

Ответь ТОЛЬКО валидным JSON:
{{
  "risk_level": 0,
  "what_doing": "Коротко что делает/пытается сделать мошенник. 1-2 предложения.",
  "risk_description": "Описание рисков. 1 предложение.",
  "consequences": "Что произойдёт если продолжить общение. 1-2 предложения.",
  "recommendation": "Конкретное действие прямо сейчас. 1 предложение.",
  "scheme": "название схемы мошенничества или null",
  "confidence": "высокая или средняя или низкая"
}}

ШКАЛА РИСКА: 0=безопасно 1=минимальный 2=подозрения 3=высокий 4=очень высокий 5=явное мошенничество
Только JSON."""

@app.post("/api/v1/antiscam/analyze")
async def antiscam_analyze(req: AntiscamAnalyzeRequest):
    """Этап 2 — анализ всего накопленного контекста"""
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        question_block = f"ВОПРОС ПОЛЬЗОВАТЕЛЯ: {req.question}" if req.question else ""
        prompt = ANALYZE_PROMPT.format(facts=req.facts, question_block=question_block)
        ds_key = DEEPSEEK_API_KEY or AITUNNEL_API_KEY
        ds_base = DEEPSEEK_BASE_URL if DEEPSEEK_API_KEY else AITUNNEL_BASE_URL
        ds_model = "deepseek-reasoner" if DEEPSEEK_API_KEY else "deepseek-r1-0528"
        ds_headers = {"Authorization": f"Bearer {ds_key}", "Content-Type": "application/json"}
        ds_data = {"model": ds_model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 1000}
        ds_resp = requests.post(f"{ds_base}chat/completions", headers=ds_headers, json=ds_data, timeout=60)
        result_text = ds_resp.json()["choices"][0]["message"]["content"].strip()

        import re as re_mod
        json_match = re_mod.search(r"\{.*\}", result_text, re_mod.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"error": "parse_error", "raw": result_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка анализа: {str(e)}")


class AntiscamChatRequest(BaseModel):
    facts: str
    question: str
    history: Optional[list] = []

@app.post("/api/v1/antiscam/chat")
async def antiscam_chat(req: AntiscamChatRequest):
    """Диалог в контексте антискам анализа"""
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        system = """Ты консультант по защите от мошенников OkTolk.
Ты уже проанализировал материалы пользователя и знаешь контекст ситуации.
Действуй как опытный следователь и помощник одновременно.

ПРАВИЛА:
- Если вопрос простой — отвечай коротко и по делу
- Если ситуация сложная — задай уточняющий вопрос чтобы дать точный совет
- Если человек уже перевёл деньги или передал данные — дай пошаговый план действий прямо сейчас
- Если человек спрашивает что делать — давай конкретные действия, не общие слова
- Говори простым языком без терминов
- НЕ используй markdown: никаких **, *, ##, ###, ---, нумерованных списков с точками
- Если нужен список — пиши каждый пункт с новой строки через цифру и точку: "1. 2. 3."
- Никогда не говори "я не могу помочь" — всегда давай конкретный совет или задай уточняющий вопрос

ЕСЛИ ЧЕЛОВЕК УЖЕ ПОСТРАДАЛ:
1. Сначала скажи что нужно сделать ПРЯМО СЕЙЧАС (заблокировать карту, сменить пароль и т.д.)
2. Потом объясни следующие шаги (куда обратиться, как вернуть деньги)
3. Предупреди о возможных дальнейших попытках мошенников"""

        messages = [{"role": "system", "content": system}]
        messages.append({"role": "user", "content": f"Контекст проверки:\n{req.facts}"})
        messages.append({"role": "assistant", "content": "Понял, я изучил материалы. Задавайте вопросы."})
        
        for h in (req.history or [])[-6:]:
            if h.get("role") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        
        messages.append({"role": "user", "content": req.question})

        headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
        data = {
            "model": "gemini-2.5-flash-lite",
            "messages": messages,
            "max_tokens": 400
        }
        response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
        reply = response.json()["choices"][0]["message"]["content"].strip()
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


# ── Finance AI Parser ────────────────────────────────────────────
class FinanceParseRequest(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    mime_type: str = "image/jpeg"
    user_id: Optional[int] = None  # берётся из токена

@app.post("/api/v1/finance/parse")
async def finance_parse(req: FinanceParseRequest, user=Depends(get_current_user)):
    """AI парсинг финансовых данных (user_id из токена)"""
    if not AITUNNEL_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен")
    try:
        headers = {"Authorization": f"Bearer {AITUNNEL_API_KEY}", "Content-Type": "application/json"}
        
        FINANCE_PROMPT = """Ты финансовый помощник. Извлеки из текста или фото чека информацию о расходе.

Категории: shop (магазины/продукты), pharmacy (медицина/аптека/врач), utility (ЖКУ/коммуналка/свет/газ/вода), credit (кредит/ипотека/займ), transport (транспорт/такси/бензин/проезд), leisure (досуг/кафе/ресторан/развлечения), other (прочее)

Ответь ТОЛЬКО валидным JSON:
{"amount": число, "category": "код категории", "comment": "краткое описание", "merchant": "название магазина если есть"}

Если не удалось определить сумму — верни {"error": "no_amount"}"""

        if req.image_base64:
            messages = [{"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:{req.mime_type};base64,{req.image_base64}"}},
                {"type": "text", "text": FINANCE_PROMPT}
            ]}]
        else:
            messages = [{"role": "user", "content": f"{FINANCE_PROMPT}\n\nТекст: {req.text}"}]

        data = {"model": "gemini-2.5-flash-lite", "messages": messages, "max_tokens": 200}
        response = requests.post(f"{AITUNNEL_BASE_URL}chat/completions", headers=headers, json=data, timeout=30)
        result_text = response.json()["choices"][0]["message"]["content"].strip()

        import re as re_mod
        json_match = re_mod.search(r"\{.*\}", result_text, re_mod.DOTALL)
        if not json_match:
            raise HTTPException(status_code=400, detail="Не удалось распознать")
        
        parsed = json.loads(json_match.group())
        if "error" in parsed:
            raise HTTPException(status_code=400, detail="Сумма не найдена")

        # Сохраняем в БД
        if db_pool:
            async with db_pool.acquire() as conn:
                row_id = await conn.fetchval(
                    "INSERT INTO finance_records (user_id, category, amount, comment) VALUES ($1,$2,$3,$4) RETURNING id",
                    user["id"], parsed.get("category", "other"), float(parsed["amount"]), 
                    parsed.get("comment", "") + (" · " + parsed.get("merchant", "") if parsed.get("merchant") else "")
                )
                parsed["id"] = row_id
                parsed["status"] = "saved"

        return parsed
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


@app.get("/api/v1/finance/summary/me")
async def get_finance_summary_me(user=Depends(get_current_user)):
    """Summary расходов текущего пользователя (user_id из токена)"""
    if not db_pool:
        return {"month": "", "categories": []}
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM finance_records
            WHERE user_id=$1
            AND recorded_at >= date_trunc('month', NOW())
            GROUP BY category
        """, user["id"])
        return {"month": datetime.now().strftime("%Y-%m"), "categories": [dict(r) for r in rows]}

app.mount("/", StaticFiles(directory=".", html=True), name="static")
