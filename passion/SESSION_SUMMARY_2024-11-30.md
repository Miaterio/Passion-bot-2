# Зведення Сесії: Виправлення Chat Interface

## Виправлені Проблеми

### 1. TypeScript Помилки
**Проблема:** Помилки типів при компіляції
- `Avatar` interface mismatch між `prompts.ts` і `ChatInterface.tsx`
- `initDataRaw` type error в `page.tsx`

**Рішення:**
- Оновлено `ChatInterface.tsx` для використання спільного `Avatar` interface з `prompts.ts`
- Додано type guard для `initDataRaw`: `typeof lp.initDataRaw === 'string' ? lp.initDataRaw : ''`

**Файли:** `ChatInterface.tsx`, `page.tsx`

---

### 2. Проблема Скролінгу
**Проблема:** Неможливість прокрутки всередині контейнера чату

**Причина:** Конфлікт вкладених scroll контейнерів - `BounceEffect` очікував бути основним scroll контейнером, але був загорнутий в інший `overflow-y-auto` div.

**Рішення:**
- Оновлено `BounceEffect` компонент:
  - Додано підтримку `className` prop
  - Змінено `height: auto` → `height: 100%`
- Рефакторинг `ChatInterface`:
  - Видалено зайвий wrapper div з `overflow-y-auto`
  - `BounceEffect` тепер отримує `className="flex-1"` напряму
  - Padding перенесено на внутрішній content div

**Файли:** `BounceEffect.tsx`, `ChatInterface.tsx`

---

### 3. "Стрибок" При Відкритті Клавіатури
**Проблема:** При натисканні на input весь чат "зникає вгору" і "з'являється знизу"

**Причина:** Конфлікт двох механізмів прокрутки:
1. `scrollToBottom()` - прокручує до останнього повідомлення при зміні messages/isTyping
2. `handleResize` → `scrollIntoView` - прокручує до input при resize viewport

**Рішення:**
- Видалено весь `useEffect` з `handleResize` (рядки 33-50 в ChatInterface)
- Браузер і Telegram автоматично забезпечують видимість input при відкритті клавіатури
- Ручне втручання створювало конфлікт з нативною поведінкою

> **Статус:** Проблема повністю не вирішена, відкладено для подальшого дослідження

**Файл:** `ChatInterface.tsx`

---

### 4. Зайвий Відступ Знизу
**Проблема:** Input знаходився занадто високо, великий проміжок між input і home indicator

**Причина:** Подвійний padding:
- `Page.tsx`: `pb-[34px]` (iOS) / `pb-[46px]` (Android)
- `ChatInterface.tsx`: `paddingBottom: 'var(--tg-content-safe-area-inset-bottom)'`

**Рішення:**
1. У `Page.tsx`: видалено bottom padding коли `chatMode === true`
2. У `ChatInterface.tsx`: додано `paddingBottom: 'var(--tg-content-safe-area-inset-bottom)'` до Input Area

**Результат:** Input тепер розташований безпосередньо над home indicator з правильним safe area відступом.

**Файли:** `page.tsx`, `ChatInterface.tsx`

---

## Поточні Відступи

### Header
- **Top padding:** `calc(var(--tg-content-safe-area-inset-top) + 10px)`
  - Safe area (статус-бар) + 10px
- **Bottom padding:** `10px`

### Input Area
- **Bottom padding:** `var(--tg-content-safe-area-inset-bottom)`
  - ~34px на iPhone, 0px на Android
- **Internal padding:** `p-2` (8px навколо input)

---

## Технічні Деталі

### Keyboard Handling Research
При відкритті клавіатури в Telegram Mini App на iOS:
- Viewport динамічно змінює висоту
- Telegram емітує `viewport_changed` event
- `tma.js` SDK надає `Viewport.stability` flag
- Flexbox layout (`flex-col`, `flex-1`) автоматично адаптується до змін viewport
- Це найбільш стабільний підхід для Mini Apps

### Layout Structure
```
Page.tsx (chatMode)
└─ Main Content Area (flex-1, no bottom padding)
   └─ ChatInterface (flex flex-col h-full)
      ├─ Header (absolute, top)
      ├─ BounceEffect (flex-1, scroll container)
      │  └─ Messages + Typing Indicator
      └─ Input Area (shrink-0, bottom safe area padding)
```

---

---

### 5. SafeAreaProvider API Compatibility (v3.x)
**Проблема:** TypeScript помилки та некоректна робота CSS змінних для safe area
- Імпорти `useMiniApp`, `useViewport` з `@tma.js/sdk-react` були видалені у v3.x
- Спроби використання `.get()` та `.on()` методів, які не існують у v3 API
- Ручне управління CSS змінними замість реактивних біндингів

**Причина:** SDK v3.x використовує нову архітектуру з сигналами (signals) замість хуків:
- `viewport`, `miniApp`, `themeParams` - це екземпляри з реактивними властивостями
- Властивості є Computed signals, що викликаються як функції: `viewport.height()`
- Вбудований метод `bindCssVars()` автоматично створює та оновлює CSS змінні

**Рішення:**
1. **Змінено імпорти:**
   ```typescript
   // Було (v2.x):
   import { useMiniApp, useViewport } from '@tma.js/sdk-react';
   
   // Стало (v3.x):
   import { miniApp, viewport, themeParams } from '@tma.js/sdk';
   ```

2. **Використано вбудований bindCssVars():**
   - `themeParams.bindCssVars()` - автоматично створює `--tg-theme-*` змінні
   - `viewport.bindCssVars()` - автоматично створює viewport та safe area змінні
   - Обидва методи реактивно оновлюють значення при змінах

3. **Кастомні назви CSS змінних:**
   ```typescript
   viewport.bindCssVars((key) => {
     const nameMap: Record<string, string> = {
       'contentSafeAreaInsetTop': '--tg-content-safe-area-inset-top',
       'contentSafeAreaInsetBottom': '--tg-content-safe-area-inset-bottom',
       'stableHeight': '--tg-viewport-stable-height',
       // ...
     };
     return nameMap[key] || `--tg-viewport-${key}`;
   });
   ```
   Це забезпечує сумісність з існуючим кодом, що очікує змінні без префіксу `viewport-`.

**Результат:**
- Видалено всі TypeScript помилки
- CSS змінні `--tg-content-safe-area-inset-*` правильно встановлюються
- Змінні автоматично оновлюються при змінах viewport (keyboard, rotation)
- Видалено ручне управління та event listeners

**Файли:** 
- `/passion/src/components/SafeAreaProvider/SafeAreaProvider.tsx`
- `/passion/components/SafeAreaProvider/SafeAreaProvider.tsx`

---

## API Changes: @tma.js/sdk v3.x

### Removed (v2.x)
```typescript
// React hooks (видалені)
import { useMiniApp, useViewport, useThemeParams } from '@tma.js/sdk-react';
const miniApp = useMiniApp();
const viewport = useViewport();
```

### New (v3.x)
```typescript
// Прямі імпорти екземплярів
import { miniApp, viewport, themeParams } from '@tma.js/sdk';

// Виклик методів
miniApp.ready();
viewport.expand();

// Доступ до значень через signals (виклик як функцій)
const height = viewport.height();
const safeArea = viewport.contentSafeAreaInsets();

// Автоматичний біндинг CSS змінних
const unbind = viewport.bindCssVars();
return unbind; // cleanup
```

### Ключові відмінності:
1. **Signals замість hooks** - властивості є Computed signals з `@tma.js/signals`
2. **Функції замість геттерів** - `viewport.height()` замість `viewport.height`
3. **bindCssVars()** - вбудований метод для автоматичного управління CSS змінними
4. **Немає event listeners** - `bindCssVars()` автоматично підписується на зміни
5. **useSignal hook** - для React компонентів: `useSignal(viewport.height)` якщо потрібно в JSX

---

## Інше

- Перезапущено dev сервер та ngrok тунель
- Сервери працюють на http://localhost:3000
- Дата сесії: 30.11.2024
- **Оновлено:** Додано виправлення SafeAreaProvider для @tma.js/sdk v3.x (30.11.2024)
