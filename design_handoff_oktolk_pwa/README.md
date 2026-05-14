# Handoff: OkTolk PWA — Modern Redesign

## Overview

OkTolk — это PWA-приложение AI-ассистента для аудитории 40+ (россияне). Помогает с защитой от мошенничества, разбором документов, контролем здоровья и финансов, чтением проверенных новостей и переходом на проверенные сайты. Ядро продукта — чат с AI (Ok чат).

В этом пакете — редизайн с акцентом на современность, чистоту и интуитивность.

## About the Design Files

Файлы в этом пакете — **дизайн-референсы, реализованные в HTML+React-прототипе**. Они показывают целевой внешний вид и поведение, **но это не production-код для копирования один-в-один**.

Задача — **воссоздать эти экраны в реальной кодовой базе** (React/React Native/Vue/Flutter/etc.), используя её существующие паттерны, библиотеки компонентов и систему сборки. Если кодовой базы ещё нет — выбрать подходящий стек (рекомендуется React + TypeScript + Vite/Next.js для PWA) и реализовать там.

HTML-прототип использует iframe iOS-frame только для презентационных целей. Реальное PWA должно быть адаптивным и работать на любых экранах.

## Fidelity

**High-fidelity (hifi).** Все экраны проработаны попиксельно: финальные цвета, типографика, отступы, скругления, анимации входа, состояния hover/active. Цель — воссоздать UI пиксель-в-пиксель, используя собственную UI-библиотеку (рекомендуется Radix UI / shadcn-ui + Tailwind, либо собственные компоненты).

Иллюстративные пустые состояния («Скоро появится») — placeholder для будущей функциональности. Их можно временно оставить как заглушки.

---

## Дизайн-система (Design System)

### Шрифт

- **Семейство:** Onest (Google Fonts) — `400, 500, 600, 700, 800`
- **Fallback:** `-apple-system, system-ui, 'Segoe UI', sans-serif`
- **Base font-size:** `16px` (доступно `14–20px` через настройки доступности для аудитории 40+)
- **Сглаживание:** `-webkit-font-smoothing: antialiased`
- **Letter-spacing:** заголовки `-0.02em` … `-0.03em` для крупного кегля, основной текст `0`

### Цветовые токены (Light theme · Cobalt palette — default)

```
--bg              : #FAFAF7
--surface         : #FFFFFF
--surface-2       : #F5F5F1
--surface-tint    : #EEF0FF
--border          : rgba(15,15,20,0.07)
--border-strong   : rgba(15,15,20,0.12)

--text            : #16161A
--text-muted      : #6B6B72
--text-subtle     : #9B9BA3

--primary         : #3B4FE0
--primary-hover   : #2D3FC5
--primary-tint    : #EEF0FF
--primary-on      : #FFFFFF
--accent          : #7A8BFF

--danger          : #D14343
--danger-tint     : #FCEDED
--warn            : #C77A20
--warn-tint       : #FBF1E1
--success         : #1F8A5B
--success-tint    : #E6F2EC
```

### Альтернативные палитры (Tweaks)

| ID       | Primary  | Hover    | Tint     | Accent   |
|----------|----------|----------|----------|----------|
| cobalt   | `#3B4FE0`| `#2D3FC5`| `#EEF0FF`| `#7A8BFF`|
| forest   | `#1F6E54`| `#175140`| `#E6F2EC`| `#5DB490`|
| sand     | `#B05636`| `#94462C`| `#F7ECE3`| `#D89070`|

### Dark theme (overrides)

```
--bg            : #0C0C0E
--surface       : #17171A
--surface-2     : #1F1F23
--surface-tint  : #1B1F3A
--border        : rgba(255,255,255,0.07)
--border-strong : rgba(255,255,255,0.14)
--text          : #F2F2F0
--text-muted    : #A1A1A8
--text-subtle   : #6E6E76
```

### Радиусы (default scale)

```
--r-xs    : 6px
--r-sm    : 9px
--r-md    : 13px   (стандартный radius для small UI)
--r-lg    : 19px   (карточки)
--r-xl    : 25px   (hero, sheet, modal)
--r-pill  : 999px
```

В Tweaks доступен множитель `0.4×–1.6×` для всей шкалы.

### Тени

```
--shadow-card : 0 1px 2px rgba(15,15,20,0.04), 0 6px 24px -8px rgba(15,15,20,0.08)
--shadow-soft : 0 0.5px 0 rgba(15,15,20,0.04), 0 8px 30px -12px rgba(15,15,20,0.12)
--shadow-pop  : 0 12px 40px -8px rgba(15,15,20,0.18), 0 0 0 1px rgba(15,15,20,0.04)
```

### Стили карточек (Tweaks)

- **flat** — `--surface-2` фон, без бордера, без тени
- **soft** — `--surface` + `0.5px var(--border)` + `--shadow-soft` (default)
- **outline** — `--surface` + `1px var(--border-strong)`, без тени

### Иконки

Используется **Lucide Icons** (lucide.dev) — stroke-стиль, `strokeWidth: 1.75`, `strokeLinecap: round`, `strokeLinejoin: round`, `currentColor`.

Размеры в дизайне: `16, 18, 20, 22, 24px`. **Эмодзи не использовать** — только Lucide.

---

## Экраны (Screens)

Приложение состоит из 5 основных экранов, доступных через нижний tab-bar, плюс 3 модальных overlay (Chat, Profile sheet, Voice modal, Notification sheet).

### 1. Главная (Home)

**Цель:** быстрый доступ к AI-ассистенту, последние проверки, точки входа в защиту.

**Layout (сверху вниз):**
1. **TopBar** — sticky, `padding: 14px 18px 10px`, на фоне `--bg`. Слева кнопка-уведомление с красной точкой, по центру лого `OkTolk•`, справа кнопка-профиль. Иконки 44×44, `--r-md`, `0.5px solid --border`.
2. **Greeting block** — `padding: 6px 22px 22px`
   - Eyebrow: «ДОБРОЕ УТРО,» — `12px / 500 / letter-spacing 0.12em / uppercase / --text-subtle`
   - Имя: «Евгений.» — `34px / 700 / letter-spacing -0.03em`. Точка в `--primary`.
   - Subtitle: `15px / 400 / --text-muted / line-height 1.45`, max-width 320px
3. **Chips** — `padding: 0 22px`, горизонтальный flex с `gap: 8px`. Три chip: «Антискам», «Документ», «Инструкция». Каждый chip:
   - Высота 40px, `--r-pill`, `--surface` + `0.5px --border`
   - Иконка 18px в `--primary` слева, текст `14.5px / 500 / --text`
4. **AI composer** — `margin: 0 18px`, ниже chips через `padding-top: 18px`
   - Контейнер: `--surface`, `0.5px --border`, `--r-lg`, `--shadow-card`, высота 56px
   - Input: `15.5px`, placeholder в `--text-subtle`
   - Кнопка-отправка справа: 44×44, `--r-md`, `--primary`, иконка Send. `disabled` если input пуст.
5. **Modes** — 3 columns grid `padding: 0 18px`, `gap: 10px`. Карточка:
   - `--surface` + `--shadow-card` + `--r-md`, `padding: 18px 8px 14px`
   - Иконка 44×44 на `--primary-tint` фоне, иконка в `--primary`
   - Подпись uppercase: «ГОЛОС / ФОТО / ДОКУМЕНТ», `12px / 600 / --text-muted`
6. **Recent checks** — `section padding: 22px 18px 0`
   - Заголовок: «НЕДАВНИЕ ПРОВЕРКИ» — uppercase `13px / 600 / --text-subtle`
   - Карточка `--r-lg`, внутри list rows с `0.5px --border` разделителями
   - Каждая row: иконка-кружок 36×36 (success/danger tint) + title `15.5px / 500` + sub `12.5px / --text-subtle` + chevron-right

### 2. Финансы

**Цель:** учёт расходов, разбор кредитов и платежей (placeholder + AI Q&A).

**Layout:**
1. **Hero card** — `margin: 0 18px`, `--r-xl`, `padding: 22px`
   - Градиент: `linear-gradient(135deg, --primary, mix(--primary, --accent) 30%)`
   - Eyebrow uppercase «МОИ ФИНАНСЫ» белого 78% opacity
   - Title «Расходы за май» 28px/700 white
   - Большая сумма «0 ₽» — 44px/700, ₽ в 28px/60% opacity, `font-variant-numeric: tabular-nums`
   - Внутри hero: stat-row из 2 stat-block (доход / остаток). Stat-block: `rgba(255,255,255,0.14)` + `backdrop-filter: blur(8px)` + `0.5px rgba(255,255,255,0.2)` + `--r-md`
2. **Placeholder card** — dashed border `1.5px --border-strong`, фон `--surface-tint`, центрированный, с описанием будущей функциональности.
3. **AskAICard** (общий компонент) с 3 prompts и composer.

### 3. Здоровье

Аналогично Финансам, но hero с зелёным градиентом `linear-gradient(135deg, #15493A, #1F6E54 60%, #2E8E73)`. Stat-blocks: «Давление —/—» и «Пульс —». Placeholder про контроль показателей и лекарств. AskAICard с prompts: «Разбор лекарства», «Что значит давление 140/90?», «Что снижает давление?».

### 4. Новости

**Цель:** проверенные новости с фильтрацией по типу важности и AI-объяснениями простым языком.

**Layout:**
1. **Hero (news)** — тёмно-серый градиент `linear-gradient(135deg, #18171F, #2C2B36)`
   - Заголовок «Лента за вас» + sub «проверенные источники»
   - CTA внутри hero: «Слушать ленту как радио» — полупрозрачная кнопка `rgba(255,255,255,0.16)` + `0.5px rgba(255,255,255,0.24)`
2. **Filters** — горизонтальный scroll, `padding: 4px 18px`, gap 8px
   - Filter pill: высота 34px, `--r-pill`, `--surface` + `0.5px --border`. Активный: `--text` фон, `--bg` текст. С count-числом.
3. **News cards** — список, gap 12px. Каждая карточка:
   - badge (danger/success/warn) сверху + время `12px --text-subtle`
   - title `18px / 700`, body 3-line clamped (раскрывается по клику)
   - source row: `--surface-2` фон + иконка-pin + chevron
   - CTA «Объясни просто» — `btn-primary`, открывает чат с предзаполненным вопросом

### 5. Сайты

**Цель:** каталог проверенных сайтов по 6 категориям.

**Layout:**
1. **Hero (sites)** — фиолетовый градиент `linear-gradient(135deg, #3A2A6E, #5340A8 60%, #6B53C9)`. Текст: «Проверенные ресурсы / 34 сайта в 6 категориях».
2. **Category grid** — 2 columns, gap 10px. Каждая карточка:
   - `--r-lg`, `padding: 18px`, `min-height: 132px`
   - Иконка-кружок 44×44 с tint background и primary-цветом категории
   - Название категории `16px / 600` + count `13px --text-subtle`
   - Категории: Госорганы (#5B5FCF), Магазины (#C77A20), Аптеки (#D14367), Досуг (#1F8A5B), Банки (#3B4FE0), Медцентры (#7A5AE0)
3. **Часто посещаемые** — list-card с 3 сайтами (Госуслуги, Сбербанк, Аптека.ру) + external-icon

---

## Нижняя навигация (TabBar)

5 столбцов, центральный — главный CTA «Ok чат».

- **Высота bar:** `padding: 10px 8px max(14px, env(safe-area-inset-bottom))`
- **Фон:** `color-mix(in srgb, var(--bg) 92%, transparent)` + `backdrop-filter: blur(20px) saturate(160%)`
- **Top border:** `1px solid var(--border-strong)` (чётко видимый)
- **Grid:** `repeat(5, 1fr)` без gap
- **Без вертикальных разделителей** между табами

**Обычный таб:**
- Иконка Lucide 24px, `strokeWidth 1.9`, цвет `--text` opacity 0.78
- Подпись `11.5px / 600 / letter-spacing 0.01em` (sentence case, не uppercase!)
- Активный: иконка/текст в `--primary` opacity 1
- Индикатор активного: pill `28×3px` `--primary` сверху таба

**Центральный таб «Ok чат»:**
- Круг 56×56, `--primary` фон, `0 4px 14px -3px rgba(--primary,55%)` shadow + `0 0 0 4px var(--bg)` (вырез на фоне)
- Приподнят: `margin-top: -18px`
- Внутри круга 2 строки:
  - Верхняя: «Ok» — `17px / 700 / letter-spacing -0.03em`, белый
  - Нижняя: «чат» — `10px / 600 / letter-spacing 0.02em`, белый 85% opacity
- При активном — увеличенная тень

---

## Модальные слои (Overlays)

### Chat overlay
Полноэкранный, slide-up от `100%` за 0.3s `cubic-bezier(0.22, 1, 0.36, 1)`.
- Header: кнопка-назад (chevron-left) + аватар «Ok» круг 36px + название «OkTolk AI» + статус «готов помочь» с зелёной точкой
- Stream: чат-баблы. User — `--primary` фон, белый текст, выровнен вправо, `border-bottom-right-radius: 6px`. AI — `--surface` + `0.5px --border`, выровнен влево, `border-bottom-left-radius: 6px`
- Typing indicator: 3 точки с pulse-анимацией (1.2s loop)
- Composer внизу с границей сверху

**Интеграция с AI:** в прототипе используется `window.claude.complete({ messages: [...] })`. В production-кодовой базе — подключите свой backend (Claude API, OpenAI, кастомный).

### Profile sheet
Bottom-sheet, slide-up из `100%`. `--r-xl` сверху, ручка-grip сверху, max-height 80%.
- Шапка: аватар-инициал 56×56 в `--primary-tint`/`--primary` + имя/телефон
- Список: «Личные данные», «Безопасность», «Уведомления», «Тариф», «Сохранённое», «Выйти» (в danger-tint)

### Notification sheet
Аналогичный bottom-sheet с заголовком «Уведомления» + кнопкой «Прочитать все».
- 4 типа уведомлений: danger (мошенничество), success (зачисления), info (новости), reminder (напоминания)

### Voice modal
Полноэкранный overlay с blur-фоном.
- Орб 200×200, radial-gradient `--primary`, pulse-анимация (2s scale 1.06)
- Концентрические кольца с ring-out анимацией
- Текст «Слушаю вас…» + hint, кнопка закрытия снизу

---

## Состояние и Tweaks

Приложение поддерживает **runtime-настройки** (в production вынесите в Settings):

- **Тема:** light / dark
- **Палитра:** cobalt / forest / sand
- **Стиль карточек:** flat / soft / outline
- **Радиус скругления:** множитель 0.4×–1.6×
- **Размер шрифта:** 14–20px (важно для 40+)

Реализация через CSS-кастом-проперти на `:root`. Persistance — localStorage.

---

## Анимации

- **Screen enter:** `opacity 0 → 1`, `translateY(8px) → 0`, 0.25s ease-out
- **Sheet enter:** `translateY(100%) → 0`, 0.28s `cubic-bezier(0.22, 1, 0.36, 1)`
- **Chat slide-up:** `translateY(100%) → 0`, 0.3s `cubic-bezier(0.22, 1, 0.36, 1)`
- **Message fade-in:** `opacity 0 → 1`, `translateY(4px) → 0`, 0.25s ease-out
- **Voice orb pulse:** scale 1 ↔ 1.06, 2s ease-in-out infinite
- **Voice ring:** scale 0.95 → 1.4, opacity 1 → 0, 2s ease-out infinite (две волны со сдвигом 0.4s)
- **Typing dots:** scale 0.85 ↔ 1, opacity 0.3 ↔ 1, 1.2s infinite, сдвиг по 0.15s
- **Hover карточки:** `translateY(-2px)`, 0.18s
- **Active:** `scale(0.97-0.98)` через `:active`
- **Button active:** `scale(0.95)`

---

## Файлы в этом пакете

- `OkTolk.html` — **готовый single-file прототип** (откройте в браузере). Это финальный билд всего приложения.
- `styles.css` — все стили и токены
- `icons.jsx` — компоненты Lucide-иконок (~50 шт.)
- `screens.jsx` — все 5 экранов + TopBar + TabBar
- `overlays.jsx` — Chat, Profile, Notification, Voice
- `app.jsx` — оркестратор: состояние, navigation, theme, tweaks
- `ios-frame.jsx` — iOS-frame только для презентации (НЕ копировать в production)
- `tweaks-panel.jsx` — Tweaks-панель только для презентации (НЕ копировать)

---

## Рекомендации по реализации

1. **Стек:** React 18+ / TypeScript / Vite + PWA-plugin или Next.js. Для нативного — React Native или Flutter.
2. **CSS:** Tailwind с кастомными токенами в `tailwind.config` ИЛИ CSS modules + CSS variables. Tokens обязательно как CSS custom properties для динамической смены темы и палитры.
3. **Иконки:** `lucide-react` (npm).
4. **Шрифт:** `@fontsource/onest` или Google Fonts (предпочесть self-host для скорости).
5. **State:** Zustand / Jotai для глобального (theme, tweaks, auth), React Query для серверного.
6. **Routing:** React Router / TanStack Router. Tab-bar нав = 5 роутов.
7. **PWA-манифест:** standalone display, theme_color = `--primary`, background_color = `--bg`. Service Worker для offline. Иконки 192/512.
8. **A11y:** обязательно `aria-label` на all icon-only buttons. Min hit-area 44×44px (для 40+ — лучше 48×48). Контрастность WCAG AA как минимум.
9. **Адаптивность:** прототип фиксирован под iPhone-frame для презентации. **Production должен быть responsive** — на десктопе хорошо смотрится центрированная колонка max-width 480px, можно добавить sidebar-навигацию вместо bottom-tab.

---

## Что НЕ переносить из прототипа

- iOS-frame (`ios-frame.jsx`) — это обёртка для презентации
- Tweaks-панель (`tweaks-panel.jsx`) — для дизайн-демо. В реальном PWA настройки должны быть на экране Профиль → Настройки
- `window.claude.complete` — заглушка, замените на ваш AI-backend (Claude API через свой proxy)
- Тестовые данные новостей, контактов, категорий — замените реальными endpoint-ами

---

## Контент и тон голоса

- Аудитория 40+ — без жаргона, **простыми словами**
- Заголовки короткие, в действенной форме: «Расходы за май», «Контроль показателей»
- AI-промпт для ответов: *«Отвечай ясно, кратко, без жаргона, на русском. Если речь о мошенничестве или подозрительном сообщении — дай чёткие шаги защиты.»*
- Пустые состояния — обнадёживающие, с пояснением что появится
