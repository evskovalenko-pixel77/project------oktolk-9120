// app.jsx — OkTolk PWA orchestrator. Theme, state, navigation, tweaks.

const PALETTES = {
  cobalt: {
    label: 'Cobalt',
    primary: '#3B4FE0',
    primaryHover: '#2D3FC5',
    primaryTint: '#EEF0FF',
    primaryTintDark: 'rgba(123,139,255,0.16)',
    accent: '#7A8BFF',
    swatch: ['#3B4FE0', '#7A8BFF', '#EEF0FF'],
  },
  forest: {
    label: 'Forest',
    primary: '#1F6E54',
    primaryHover: '#175140',
    primaryTint: '#E6F2EC',
    primaryTintDark: 'rgba(93,180,144,0.18)',
    accent: '#5DB490',
    swatch: ['#1F6E54', '#5DB490', '#E6F2EC'],
  },
  sand: {
    label: 'Sand',
    primary: '#B05636',
    primaryHover: '#94462C',
    primaryTint: '#F7ECE3',
    primaryTintDark: 'rgba(216,144,112,0.18)',
    accent: '#D89070',
    swatch: ['#B05636', '#D89070', '#F7ECE3'],
  },
};

function applyTheme(t) {
  const root = document.documentElement;
  const p = PALETTES[t.palette] || PALETTES.cobalt;
  root.style.setProperty('--primary', p.primary);
  root.style.setProperty('--primary-hover', p.primaryHover);
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--primary-tint', t.dark ? p.primaryTintDark : p.primaryTint);

  // radius scale (base = 1.0 → 14px md)
  const r = t.radius;
  root.style.setProperty('--r-xs', `${Math.max(4, 6 * r)}px`);
  root.style.setProperty('--r-sm', `${Math.max(6, 9 * r)}px`);
  root.style.setProperty('--r-md', `${Math.max(8, 13 * r)}px`);
  root.style.setProperty('--r-lg', `${Math.max(10, 19 * r)}px`);
  root.style.setProperty('--r-xl', `${Math.max(12, 25 * r)}px`);

  root.style.setProperty('--fs-base', `${t.fontSize}px`);

  root.dataset.theme = t.dark ? 'dark' : 'light';
  root.dataset.cards = t.cards;
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "cobalt",
  "dark": false,
  "cards": "soft",
  "radius": 1,
  "fontSize": 16
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState('home');
  const [chat, setChat] = React.useState(null);    // null | string (initial msg, '' for empty)
  const [overlay, setOverlay] = React.useState(null); // 'profile' | 'voice' | 'notif' | null

  React.useLayoutEffect(() => { applyTheme(t); }, [t]);

  const onAsk = (text) => setChat(text || '');
  const onMode = (m) => {
    if (m === 'voice') setOverlay('voice');
    else if (m === 'photo') setChat('Распознать текст с фото');
    else if (m === 'doc') setChat('Помочь разобрать документ');
  };

  return (
    <IOSDevice dark={t.dark}>
      <div className="app">
        <div className="app-scroll" style={{ paddingTop: 50 }}>
          <TopBar
            onProfile={() => setOverlay('profile')}
            onNotif={() => setOverlay('notif')}
          />
          {tab === 'home'    && <HomeScreen onAsk={onAsk} onMode={onMode}/>}
          {tab === 'finance' && <FinanceScreen onAsk={onAsk}/>}
          {tab === 'health'  && <HealthScreen onAsk={onAsk}/>}
          {tab === 'news'    && <NewsScreen onAsk={onAsk}/>}
          {tab === 'sites'   && <SitesScreen/>}
        </div>
        <TabBar active={tab} onChange={setTab}/>

        {chat !== null && <ChatOverlay initialMsg={chat} onClose={() => setChat(null)}/>}
        {overlay === 'profile' && <ProfileSheet onClose={() => setOverlay(null)}/>}
        {overlay === 'voice'   && <VoiceModal   onClose={() => setOverlay(null)}/>}
        {overlay === 'notif'   && <NotifSheet   onClose={() => setOverlay(null)}/>}
      </div>

      <TweaksPanel title="OkTolk · Tweaks">
        <TweakSection label="Тема">
          <TweakRadio label="Режим" value={t.dark ? 'dark' : 'light'}
            options={[{value:'light', label:'Светлый'}, {value:'dark', label:'Тёмный'}]}
            onChange={v => setTweak('dark', v === 'dark')}/>
          <TweakColor label="Палитра" value={PALETTES[t.palette].swatch}
            options={Object.values(PALETTES).map(p => p.swatch)}
            onChange={sw => {
              const id = Object.keys(PALETTES).find(k => PALETTES[k].swatch === sw || JSON.stringify(PALETTES[k].swatch) === JSON.stringify(sw));
              if (id) setTweak('palette', id);
            }}/>
        </TweakSection>

        <TweakSection label="Карточки">
          <TweakRadio label="Стиль" value={t.cards}
            options={[{value:'flat',label:'Плоские'},{value:'soft',label:'С тенью'},{value:'outline',label:'Контур'}]}
            onChange={v => setTweak('cards', v)}/>
          <TweakSlider label="Скругление" value={t.radius} min={0.4} max={1.6} step={0.1}
            unit="×" onChange={v => setTweak('radius', v)}/>
        </TweakSection>

        <TweakSection label="Типографика">
          <TweakSlider label="Размер шрифта" value={t.fontSize} min={14} max={20} step={1}
            unit="px" onChange={v => setTweak('fontSize', v)}/>
        </TweakSection>

        <TweakSection label="Навигация">
          <TweakSelect label="Открыть экран" value={tab}
            options={[
              {value:'home', label:'Главная'},
              {value:'finance', label:'Финансы'},
              {value:'health', label:'Здоровье'},
              {value:'news', label:'Новости'},
              {value:'sites', label:'Сайты'},
            ]}
            onChange={v => setTab(v)}/>
        </TweakSection>
      </TweaksPanel>
    </IOSDevice>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
