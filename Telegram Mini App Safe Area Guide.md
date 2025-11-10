# Safe Area и Fullscreen в Telegram Mini Apps (Next.js, TypeScript, @tma.js/sdk)

## Контекст

При запуске Telegram Mini App в режиме **Full Screen / Full Size** на iOS контент может:
- уходить под статус-бар,
- перекрываться верхними элементами Telegram (шапка с кнопкой `X`, иконки, тени),
- залезать под нижнюю область (Home Indicator, кнопки).

Это связано с тем, что в полноэкранном режиме WebView растягивается на весь экран, а безопасные зоны (safe area) нужно учитывать вручную.

Основные понятия:
- **SafeAreaInset** — отступы с учётом *системных* областей устройства (notch, статус-бар, home indicator).
- **ContentSafeAreaInset** — отступы с учётом *системных областей + интерфейса Telegram*, т.е. зона, в которой ваш контент гарантированно не будет перекрыт ничем сверху/снизу.

В новых версиях Telegram Mini Apps доступны:
- поля `safeAreaInset` и `contentSafeAreaInset` в `Telegram.WebApp`,
- события `safeAreaChanged` и `contentSafeAreaChanged`,
- режим fullscreen через `requestFullscreen`.

---

## SafeAreaInset vs ContentSafeAreaInset

### SafeAreaInset

`Telegram.WebApp.safeAreaInset`:
- `top`, `bottom`, `left`, `right` — числа в пикселях.
- учитывают:
  - вырез (notch),
  - статус-бар,
  - нижнюю систему навигации / home indicator.

Используется, чтобы не наезжать на физические ограничения экрана.

### ContentSafeAreaInset

`Telegram.WebApp.contentSafeAreaInset`:
- те же поля `top`, `bottom`, `left`, `right`,
- **дополнительно** учитывают элементы UI Telegram:
  - верхнюю панель/оверлей,
  - возможные нижние контролы.

То есть `contentSafeAreaInset` описывает *реально безопасную область для контента мини-аппа*.

Для большинства кейсов (особенно fullscreen на iOS) тебе нужен именно **ContentSafeAreaInset**.

---

## Почему не работают `env(safe-area-inset-*)` в Telegram

Классические iOS-переменные:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

внутри Telegram Mini App обычно возвращают `0`, потому что:
- мини-апп работает внутри собственного WebView Telegram,
- Telegram сам управляет безопасной зоной и не прокидывает стандартные значения как в Safari.

Поэтому:
- `padding-bottom: env(safe-area-inset-bottom);` внутри Telegram часто **не работает**,
- нужно использовать данные, которые даёт Telegram (`safeAreaInset` / `contentSafeAreaInset` или SDK).

---

## Шаг 1. Правильный meta viewport

В Next.js (например, в `app/layout.tsx` или `_document.tsx`) добавь:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
/>
```

Зачем:
- `viewport-fit=cover` разрешает занять всю область экрана (включая зоны вокруг выреза),
- дальше уже **ты** контролируешь безопасные отступы.

---

## Шаг 2. Базовая разметка контейнера

Сделай единый корневой контейнер для приложения. Например:

```tsx
// app/page.tsx или любой корневой компонент
export default function App() {
  return (
    <div className="app-wrapper">
      {/* твой UI */}
    </div>
  );
}
```

Глобальные стили:

```css
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

#__next,
.app-wrapper {
  min-height: 100vh;
}
```

---

## Шаг 3. Используем ContentSafeAreaInset через CSS

Если Telegram (или SDK) пробрасывает CSS-переменные `--tg-content-safe-area-inset-*`,
можно сразу сместить контент:

```css
.app-wrapper {
  box-sizing: border-box;
  padding-top: var(--tg-content-safe-area-inset-top, 0px);
  padding-bottom: var(--tg-content-safe-area-inset-bottom, 0px);
  padding-left: var(--tg-content-safe-area-inset-left, 0px);
  padding-right: var(--tg-content-safe-area-inset-right, 0px);

  /* Опционально: чтобы фон красиво заполнял всё */
  min-height: 100vh;
}
```

Что это даёт:
- контент **автоматически** будет подвинут вниз от статус-бара и верхних элементов Telegram,
- не уедет под нижний индикатор или кнопки.

Если CSS-переменные ещё не привязаны через SDK — см. следующий шаг.

---

## Шаг 4. Используем `@tma.js/sdk` для привязки CSS-переменных

В `@tma.js/sdk` есть удобные обёртки для работы с viewport и безопасными зонами.

Один из подходов:
1. Инициализировать SDK на клиенте.
2. Привязать значения к CSS-переменным.

Условный пример (упрощённый, для client-side компонента):

```tsx
'use client';

import { useEffect } from 'react';
import { init, viewport } from '@tma.js/sdk';

export default function Root() {
  useEffect(() => {
    // Инициализация SDK
    const app = init();

    // Монтируем viewport, если требуется (некоторые шаблоны делают это автоматически)
    viewport.mount?.().catch(() => {});

    // Привязываем CSS-переменные для viewport (в т.ч. safe area в новых версиях)
    if (viewport.bindCssVars) {
      viewport.bindCssVars();
    }

    // Готово
    app.ready();
  }, []);

  return (
    <div className="app-wrapper">
      {/* твой UI */}
    </div>
  );
}
```

Далее в CSS можно использовать:
- `--tg-viewport-height`, `--tg-viewport-stable-height`,
- и (в актуальных версиях) переменные для safe/content safe area, если они привязываются SDK.

Если хочешь работать напрямую с JS-значениями:

```tsx
useEffect(() => {
  const { webApp } = init();
  const insets = webApp.contentSafeAreaInset ?? webApp.safeAreaInset;

  document.documentElement.style.setProperty(
    '--app-safe-top',
    `${insets?.top ?? 0}px`,
  );
  // Аналогично для bottom/left/right
}, []);
```

И в CSS:

```css
.app-wrapper {
  padding-top: var(--app-safe-top, 0px);
}
```

Главное: для iOS fullscreen **ориентируйся на `contentSafeAreaInset`**, а `safeAreaInset` используй как fallback.

---

## Шаг 5. Fullscreen и события

При использовании fullscreen:

```ts
import { viewport } from '@tma.js/sdk';

await viewport.requestFullscreen();
```

После этого:
- размеры viewport и safe area могут измениться,
- Telegram шлёт события `safeAreaChanged` / `contentSafeAreaChanged`.

Если ты сам считаешь/задаёшь отступы через JS — подпишись на эти события и обновляй CSS-переменные.  
Если используешь `bindCssVars()` — SDK сделает это за тебя.

---

## Дополнительные рекомендации для iOS

### 1. Цвет статус-бара / шапки

Чтобы иконки статус-бара были читаемыми, задай цвет хедера:

```ts
const { webApp } = init();
webApp.setHeaderColor('#000000'); // пример: тёмный верх
```

Telegram подберёт контраст текста (светлый/тёмный), и визуально всё станет аккуратнее.

### 2. Контроль скролла

Чтобы избежать артефактов (белые полосы, дёргание при скролле/клавиатуре):

```css
html,
body {
  overscroll-behavior: none;
  overflow: hidden;
}

.app-wrapper {
  overflow: auto;
}
```

Таким образом:
- скролл только внутри твоего контейнера,
- не дёргается вся WebView.

---

## Минимальный практический пример (сводка)

1. **Meta-тег** с `viewport-fit=cover`.
2. **Корневой контейнер** `.app-wrapper` с `min-height: 100vh`.
3. **CSS-отступы** через `var(--tg-content-safe-area-inset-*)` или через свои переменные, обновляемые из `contentSafeAreaInset`.
4. **Fullscreen** включать через `requestFullscreen` после инициализации.
5. Тестировать на реальном iOS в Telegram, особенно:
   - верхние кнопки Telegram не перекрывают контент,
   - нижний home indicator не перекрывает кнопки,
   - при смене ориентации всё остаётся в видимой зоне.

---

## Краткое резюме

- Не полагайся на стандартные `env(safe-area-inset-*)` внутри Telegram Mini App.
- Используй данные от Telegram: `safeAreaInset` и особенно `contentSafeAreaInset`.
- Применяй их либо прямо как CSS-переменные, либо через `@tma.js/sdk` и свои переменные.
- Для fullscreen на iOS ключевое правило: **верстать внутри безопасной области контента**, а не «от края до края» без учёта врезок и UI Telegram.
