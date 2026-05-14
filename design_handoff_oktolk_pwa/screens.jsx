// screens.jsx — all OkTolk PWA screens

// ─────────────────────────────────────────────────────────────
// TopBar — shared header
// ─────────────────────────────────────────────────────────────
function TopBar({ onProfile, onNotif, hasNotif = true }) {
  return (
    <div className="topbar">
      <button className="topbar-icon" onClick={onNotif} aria-label="Уведомления">
        <IconBell size={20} sw={1.8}/>
        {hasNotif && <span className="dot" />}
      </button>
      <div className="brand">OkTolk<span className="dot"/></div>
      <button className="topbar-icon" onClick={onProfile} aria-label="Профиль">
        <IconUser size={20} sw={1.8}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TabBar
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'finance', label: 'Финансы', icon: IconWallet },
  { id: 'health',  label: 'Здоровье', icon: IconActivity },
  { id: 'home',    label: 'Ok', center: true },
  { id: 'news',    label: 'Новости', icon: IconNews },
  { id: 'sites',   label: 'Сайты', icon: IconGlobe },
];

function TabBar({ active, onChange }) {
  return (
    <div className="tabbar">
      {TABS.map(t => {
        if (t.center) {
          return (
            <button key={t.id} className="tab tab-ok"
                    data-active={active === t.id}
                    onClick={() => onChange(t.id)}>
              <span className="tab-ok-circle">
                <b>Ok</b>
                <em>чат</em>
              </span>
            </button>
          );
        }
        const I = t.icon;
        return (
          <button key={t.id} className="tab"
                  data-active={active === t.id}
                  onClick={() => onChange(t.id)}>
            <I size={24} sw={1.9}/>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home screen
// ─────────────────────────────────────────────────────────────
function HomeScreen({ onAsk, onMode, name = 'Евгений' }) {
  const [q, setQ] = React.useState('');
  const hour = new Date().getHours();
  const greet = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="screen">
      <div className="greet">
        <div className="greet-eyebrow">{greet},</div>
        <h1 className="greet-name">{name}<span className="accent">.</span></h1>
        <p className="greet-sub">Задайте вопрос, проверьте документ или сообщение на мошенничество.</p>
      </div>

      <div className="chips">
        <button className="chip" onClick={() => onAsk('Проверьте сообщение на мошенничество')}>
          <IconShield size={18}/> Антискам
        </button>
        <button className="chip" onClick={() => onAsk('Помогите разобрать документ')}>
          <IconFile size={18}/> Документ
        </button>
        <button className="chip" onClick={() => onAsk('Инструкции и как пользоваться')}>
          <IconBook size={18}/> Инструкция
        </button>
      </div>

      <div className="section" style={{ paddingTop: 18 }}>
        <div className="composer" style={{ margin: 0 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && q.trim()) { onAsk(q); setQ(''); } }}
            placeholder="Напишите свой вопрос…"
          />
          <button className="composer-send"
                  disabled={!q.trim()}
                  onClick={() => { if (q.trim()) { onAsk(q); setQ(''); } }}
                  aria-label="Отправить">
            <IconSend size={18} sw={2}/>
          </button>
        </div>
      </div>

      <div style={{ padding: '4px 0 0' }}>
        <div className="modes">
          <button className="mode" onClick={() => onMode('voice')}>
            <span className="mode-icon"><IconMic size={22}/></span>
            <span className="mode-label">Голос</span>
          </button>
          <button className="mode" onClick={() => onMode('photo')}>
            <span className="mode-icon"><IconCamera size={22}/></span>
            <span className="mode-label">Фото</span>
          </button>
          <button className="mode" onClick={() => onMode('doc')}>
            <span className="mode-icon"><IconDoc size={22}/></span>
            <span className="mode-label">Документ</span>
          </button>
        </div>
      </div>

      <RecentCard onAsk={onAsk}/>
    </div>
  );
}

function RecentCard({ onAsk }) {
  const items = [
    { t: 'Проверка СМС от «банка»', sub: 'Вчера · 14:22', danger: true },
    { t: 'Перевод от пенсионного фонда', sub: '12 мая · 09:48' },
    { t: 'Договор аренды квартиры', sub: '10 мая · 16:10' },
  ];
  return (
    <div className="section">
      <h3 className="section-title">Недавние проверки</h3>
      <div className="card" style={{ padding: 6 }}>
        {items.map((it, i) => (
          <div key={i} className="list-row" style={{ padding: '12px 14px', borderBottom: i < items.length - 1 ? undefined : 'none' }}
               onClick={() => onAsk(it.t)}>
            <div className="list-row-icon" style={{
              background: it.danger ? 'var(--danger-tint)' : 'var(--surface-2)',
              color: it.danger ? 'var(--danger)' : 'var(--text)',
            }}>
              {it.danger ? <IconAlert size={18}/> : <IconCheck size={18}/>}
            </div>
            <div className="list-row-text">
              <div className="list-row-title">{it.t}</div>
              <div className="list-row-sub">{it.sub}</div>
            </div>
            <IconChevronRight size={18} stroke="var(--text-subtle)"/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Finance screen
// ─────────────────────────────────────────────────────────────
function FinanceScreen({ onAsk }) {
  return (
    <div className="screen">
      <div style={{ padding: '4px 0' }}>
        <div className="hero indigo" style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.78, marginBottom: 6 }}>
            Мои финансы
          </div>
          <div className="hero-title">Расходы за май</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', margin: '14px 0 0', fontVariantNumeric: 'tabular-nums' }}>
            0 <span style={{ fontSize: 28, opacity: 0.6 }}>₽</span>
          </div>
          <div className="stat-row">
            <div className="stat-block">
              <div className="stat-label">Доход</div>
              <div className="stat-val">— ₽</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">Остаток</div>
              <div className="stat-val">— ₽</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="placeholder">
          <div className="placeholder-icon"><IconCreditCard size={24}/></div>
          <h3 className="placeholder-title">Скоро появится</h3>
          <p className="placeholder-text">
            Учёт расходов: аптека, магазин, коммуналка, кредиты.
            Разбор кредитов и платежей. Мониторинг бюджета.
          </p>
        </div>
      </div>

      <AskAICard
        title="Спросите AI о финансах"
        placeholder="Задайте вопрос о финансах…"
        prompts={[
          { icon: IconLightbulb, t: 'Как сэкономить на ЖКХ?' },
          { icon: IconBuilding, t: 'Что такое рефинансирование?' },
          { icon: IconTrend,    t: 'Как составить бюджет?' },
        ]}
        onAsk={onAsk}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Health screen
// ─────────────────────────────────────────────────────────────
function HealthScreen({ onAsk }) {
  return (
    <div className="screen">
      <div style={{ padding: '4px 0' }}>
        <div className="hero heart">
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.78, marginBottom: 6 }}>
            Моё здоровье
          </div>
          <div className="hero-title">Контроль показателей</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>и лекарств</div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <MiniMetric label="Давление" value="—/—" unit="мм рт.ст."/>
            <MiniMetric label="Пульс" value="—" unit="уд/мин"/>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="placeholder">
          <div className="placeholder-icon"><IconHeart size={24}/></div>
          <h3 className="placeholder-title">Скоро появится</h3>
          <p className="placeholder-text">
            Контроль давления, пульса и сахара с графиками динамики.
            Напоминания о приёме лекарств. Тариф Про — 399 ₽/мес.
          </p>
        </div>
      </div>

      <AskAICard
        title="Спросите AI о здоровье"
        placeholder="Лекарство, диагноз или показатель…"
        prompts={[
          { icon: IconPill, t: 'Разбор лекарства' },
          { icon: IconStethoscope, t: 'Что значит давление 140/90?' },
          { icon: IconLightbulb, t: 'Что снижает давление?' },
        ]}
        onAsk={onAsk}
      />
    </div>
  );
}

function MiniMetric({ label, value, unit }) {
  return (
    <div className="stat-block" style={{ flex: 1 }}>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{value}</div>
      <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2, letterSpacing: '0.04em' }}>{unit}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// News screen
// ─────────────────────────────────────────────────────────────
const NEWS = [
  {
    id: 1, cat: 'danger', tag: 'Опасно', age: '3 ч назад',
    title: 'Мошенники звонят от имени банков',
    body: 'Участились случаи звонков мошенников, представляющихся сотрудниками банков. Никогда не сообщайте код из СМС.',
    source: 'МВД России',
  },
  {
    id: 2, cat: 'success', tag: 'Льготы', age: '6 ч назад',
    title: 'Перерасчёт пенсий с 1 июня 2026',
    body: 'Пенсионный фонд проведёт автоматический перерасчёт пенсий неработающим пенсионерам. Заявление не требуется.',
    source: 'СФР',
  },
  {
    id: 3, cat: 'danger', tag: 'Опасно', age: 'Вчера',
    title: 'Фальшивые госуслуги в Telegram',
    body: 'Появились боты, имитирующие портал Госуслуг. Запрашивают паспортные данные и СНИЛС.',
    source: 'Госуслуги',
  },
  {
    id: 4, cat: 'success', tag: 'Льготы', age: '2 дн назад',
    title: 'Бесплатные лекарства расширили список',
    body: 'В перечень бесплатных препаратов для льготников включены 24 новых лекарства от давления и диабета.',
    source: 'Минздрав',
  },
  {
    id: 5, cat: 'warn', tag: 'Важно', age: '3 дн назад',
    title: 'Изменения в правилах ЖКХ',
    body: 'С 1 июля меняется порядок передачи показаний счётчиков. Срок — до 25 числа каждого месяца.',
    source: 'Госжилинспекция',
  },
];

function NewsScreen({ onAsk }) {
  const [filter, setFilter] = React.useState('all');
  const counts = {
    all: NEWS.length,
    danger: NEWS.filter(n => n.cat === 'danger').length,
    success: NEWS.filter(n => n.cat === 'success').length,
    warn: NEWS.filter(n => n.cat === 'warn').length,
  };
  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'danger', label: 'Опасное', icon: IconAlert },
    { id: 'success', label: 'Льготы', icon: IconCheck },
    { id: 'warn', label: 'Важно', icon: IconPin },
  ];
  const visible = filter === 'all' ? NEWS : NEWS.filter(n => n.cat === filter);

  return (
    <div className="screen">
      <div style={{ padding: '4px 0' }}>
        <div className="hero news">
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.78, marginBottom: 6 }}>
            Что нового
          </div>
          <div className="hero-title">Лента за вас</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>проверенные источники</div>

          <button className="btn-primary" style={{ marginTop: 18, background: 'rgba(255,255,255,0.16)', border: '0.5px solid rgba(255,255,255,0.24)', color: '#fff' }}>
            <IconHeadphones size={18}/>
            Слушать ленту как радио
            <IconArrowRight size={16}/>
          </button>
        </div>
      </div>

      <div className="filters">
        {filters.map(f => {
          const FI = f.icon;
          return (
            <button key={f.id} className="filter" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
              {FI && <FI size={14}/>}
              {f.label}
              <span className="count">{counts[f.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="section">
        {visible.map(n => <NewsCard key={n.id} n={n} onAsk={onAsk}/>)}
      </div>
    </div>
  );
}

function NewsCard({ n, onAsk }) {
  const [open, setOpen] = React.useState(false);
  const badge = { danger: 'danger', success: 'success', warn: 'warn' }[n.cat];
  return (
    <div className="news-card">
      <div className="article-meta">
        <span className={'badge ' + badge}>
          {n.cat === 'danger' && <IconAlert size={12}/>}
          {n.cat === 'success' && <IconCheck size={12}/>}
          {n.cat === 'warn' && <IconPin size={12}/>}
          {n.tag}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{n.age}</span>
      </div>
      <h3 className="article-title">{n.title}</h3>
      <p className="article-body" style={{ marginBottom: 0,
        display: open ? 'block' : '-webkit-box',
        WebkitLineClamp: open ? 'none' : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{n.body}</p>

      <div className="article-source" style={{ marginTop: 12, marginBottom: 0 }}>
        <IconPin size={14}/> {n.source}
        <span style={{ flex: 1 }}/>
        <IconChevronRight size={14}/>
      </div>

      <button className="btn-primary" style={{ marginTop: 10 }}
              onClick={() => onAsk(`Объясни простыми словами: ${n.title}`)}>
        <IconSparkles size={16}/>
        Объясни просто
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sites screen
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'gov',   name: 'Госорганы', count: 7, icon: IconBuilding, tint: '#5B5FCF', bg: 'rgba(91,95,207,0.12)' },
  { id: 'shop',  name: 'Магазины', count: 6, icon: IconCart, tint: '#C77A20', bg: 'rgba(199,122,32,0.12)' },
  { id: 'meds',  name: 'Аптеки', count: 6, icon: IconPill, tint: '#D14367', bg: 'rgba(209,67,103,0.12)' },
  { id: 'fun',   name: 'Досуг', count: 6, icon: IconMasks, tint: '#1F8A5B', bg: 'rgba(31,138,91,0.12)' },
  { id: 'banks', name: 'Банки', count: 5, icon: IconWallet, tint: '#3B4FE0', bg: 'rgba(59,79,224,0.12)' },
  { id: 'med',   name: 'Медцентры', count: 4, icon: IconStethoscope, tint: '#7A5AE0', bg: 'rgba(122,90,224,0.12)' },
];

function SitesScreen() {
  return (
    <div className="screen">
      <div style={{ padding: '4px 0' }}>
        <div className="hero sites">
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.78, marginBottom: 6 }}>
            Сайты
          </div>
          <div className="hero-title">Проверенные ресурсы</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{CATEGORIES.reduce((a, c) => a + c.count, 0)} сайтов в 6 категориях</div>
        </div>
      </div>

      <div className="cat-grid">
        {CATEGORIES.map(c => {
          const I = c.icon;
          return (
            <button key={c.id} className="cat-card">
              <div className="cat-icon" style={{ background: c.bg, color: c.tint }}>
                <I size={22}/>
              </div>
              <div>
                <h3 className="cat-name">{c.name}</h3>
                <div className="cat-count" style={{ marginTop: 4 }}>{c.count} сайтов</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="section">
        <h3 className="section-title">Часто посещаемые</h3>
        <div className="card">
          {[
            { t: 'Госуслуги', sub: 'gosuslugi.ru', icon: IconBuilding, color: '#5B5FCF' },
            { t: 'Сбербанк Онлайн', sub: 'online.sberbank.ru', icon: IconWallet, color: '#1F8A5B' },
            { t: 'Аптека.ру', sub: 'apteka.ru', icon: IconPill, color: '#D14367' },
          ].map((s, i, arr) => {
            const I = s.icon;
            return (
              <div key={i} className="list-row" style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div className="list-row-icon" style={{ background: 'color-mix(in srgb, ' + s.color + ' 14%, transparent)', color: s.color }}>
                  <I size={18}/>
                </div>
                <div className="list-row-text">
                  <div className="list-row-title">{s.t}</div>
                  <div className="list-row-sub">{s.sub}</div>
                </div>
                <IconExternal size={16} stroke="var(--text-subtle)"/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI Q&A card — shared
// ─────────────────────────────────────────────────────────────
function AskAICard({ title, placeholder, prompts, onAsk }) {
  const [q, setQ] = React.useState('');
  return (
    <div className="section">
      <div className="card card-pad">
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          <IconSparkles size={16} style={{ verticalAlign: -3, marginRight: 6, color: 'var(--primary)' }}/>
          {title}
        </h3>
        <div className="prompts">
          {prompts.map((p, i) => {
            const I = p.icon;
            return (
              <button key={i} className="prompt" onClick={() => onAsk(p.t)}>
                <span className="glyph"><I size={16}/></span>
                {p.t}
              </button>
            );
          })}
        </div>
        <div className="composer" style={{ margin: '14px 0 0' }}>
          <input value={q} onChange={e => setQ(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter' && q.trim()) { onAsk(q); setQ(''); } }}
                 placeholder={placeholder}/>
          <button className="composer-send" disabled={!q.trim()}
                  onClick={() => { if (q.trim()) { onAsk(q); setQ(''); } }}>
            <IconSend size={18} sw={2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TopBar, TabBar, HomeScreen, FinanceScreen, HealthScreen, NewsScreen, SitesScreen,
});
