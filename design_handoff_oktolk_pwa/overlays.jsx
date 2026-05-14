// overlays.jsx — Chat, Profile sheet, Voice modal

function ChatOverlay({ initialMsg, onClose }) {
  const [messages, setMessages] = React.useState(() => initialMsg
    ? [{ role: 'user', text: initialMsg }]
    : []
  );
  const [pending, setPending] = React.useState(false);
  const [input, setInput] = React.useState('');
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, pending]);

  // auto-send the initial message
  React.useEffect(() => {
    if (initialMsg && messages.length === 1 && !pending) {
      askClaude(initialMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askClaude = async (text) => {
    setPending(true);
    try {
      const reply = await window.claude.complete({
        messages: [{
          role: 'user',
          content: `Ты помощник OkTolk для людей 40+. Отвечай ясно, кратко, без жаргона, на русском. Если речь о мошенничестве или подозрительном сообщении — дай чёткие шаги защиты. Вопрос: ${text}`
        }]
      });
      setMessages(m => [...m, { role: 'ai', text: reply, source: 'OkTolk AI' }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: 'Не удалось получить ответ. Проверьте подключение к интернету.', source: 'OkTolk AI' }]);
    } finally {
      setPending(false);
    }
  };

  const send = () => {
    const t = input.trim();
    if (!t || pending) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    setInput('');
    askClaude(t);
  };

  return (
    <div className="chat-overlay">
      <div className="chat-header">
        <button className="topbar-icon" onClick={onClose} aria-label="Закрыть">
          <IconChevronLeft size={20} sw={2}/>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em',
        }}>Ok</div>
        <div className="chat-header-info">
          <p className="chat-header-title">OkTolk AI</p>
          <p className="chat-header-sub">
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: 'var(--success)', marginRight: 6, verticalAlign: 2 }}/>
            готов помочь
          </p>
        </div>
      </div>

      <div className="chat-stream" ref={streamRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '40px 20px', fontSize: 14 }}>
            Задайте любой вопрос — отвечу простым языком.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            {m.text}
            {m.role === 'ai' && m.source && (
              <div className="source"><IconSparkles size={11}/> {m.source}</div>
            )}
          </div>
        ))}
        {pending && (
          <div className="msg ai">
            <div className="typing"><i/><i/><i/></div>
          </div>
        )}
      </div>

      <div className="chat-composer">
        <div className="composer" style={{ margin: 0 }}>
          <input value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') send(); }}
                 placeholder="Спросите что-нибудь…"/>
          <button className="composer-send" disabled={!input.trim() || pending} onClick={send}>
            <IconSend size={18} sw={2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSheet({ onClose, name = 'Евгений' }) {
  const rows = [
    { icon: IconUser, t: 'Личные данные', sub: 'Имя, телефон, email' },
    { icon: IconShield, t: 'Безопасность', sub: 'PIN-код, биометрия' },
    { icon: IconBell, t: 'Уведомления', sub: 'Push, SMS, Telegram' },
    { icon: IconSettings, t: 'Тариф', sub: 'Базовый · до 31 мая' },
    { icon: IconBookmark, t: 'Сохранённое' },
    { icon: IconLogOut, t: 'Выйти', danger: true },
  ];
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div style={{ padding: '8px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--primary-tint)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700,
          }}>{name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{name} Морозов</div>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 2 }}>+7 905 ••• 18-22</div>
          </div>
        </div>
        <div>
          {rows.map((r, i) => {
            const I = r.icon;
            return (
              <div key={i} className="list-row" onClick={onClose}>
                <div className="list-row-icon" style={r.danger ? { background: 'var(--danger-tint)', color: 'var(--danger)' } : null}>
                  <I size={18}/>
                </div>
                <div className="list-row-text">
                  <div className="list-row-title" style={r.danger ? { color: 'var(--danger)' } : null}>{r.t}</div>
                  {r.sub && <div className="list-row-sub">{r.sub}</div>}
                </div>
                {!r.danger && <IconChevronRight size={16} stroke="var(--text-subtle)"/>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function VoiceModal({ onClose }) {
  return (
    <div className="voice-modal">
      <div className="voice-orb"/>
      <div style={{ textAlign: 'center' }}>
        <div className="voice-label">Слушаю вас…</div>
        <div className="voice-hint" style={{ marginTop: 8 }}>Говорите, когда будете готовы</div>
      </div>
      <button className="voice-close" onClick={onClose} aria-label="Закрыть">
        <IconClose size={22} sw={2}/>
      </button>
    </div>
  );
}

function NotifSheet({ onClose }) {
  const items = [
    { icon: IconAlert, t: 'Подозрительный СМС', sub: 'Проверьте сообщение от «Сбер»', age: '14 мин', danger: true },
    { icon: IconCheck, t: 'Пенсия зачислена', sub: '32 480 ₽ от СФР', age: '2 ч', success: true },
    { icon: IconBell,  t: 'Новость дня', sub: 'Перерасчёт пенсий с 1 июня', age: '5 ч' },
    { icon: IconClock, t: 'Напоминание', sub: 'Передать показания счётчиков', age: 'Вчера' },
  ];
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Уведомления</div>
          <button className="chip" style={{ height: 34 }} onClick={onClose}>Прочитать все</button>
        </div>
        <div>
          {items.map((r, i) => {
            const I = r.icon;
            const tint = r.danger ? 'var(--danger-tint)' : r.success ? 'var(--success-tint)' : 'var(--surface-2)';
            const color = r.danger ? 'var(--danger)' : r.success ? 'var(--success)' : 'var(--text)';
            return (
              <div key={i} className="list-row">
                <div className="list-row-icon" style={{ background: tint, color }}>
                  <I size={18}/>
                </div>
                <div className="list-row-text">
                  <div className="list-row-title">{r.t}</div>
                  <div className="list-row-sub">{r.sub}</div>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{r.age}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ChatOverlay, ProfileSheet, VoiceModal, NotifSheet });
