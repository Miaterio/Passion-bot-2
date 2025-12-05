<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# вот доп файлы

Вижу проблему! В `globals.css` используется **стабильная высота** (`--tg-initial-height`), а не **динамическая** (`--tg-viewport-height`).[^1]

## Корень проблемы

```css
/* Текущее - использует стабильную высоту 844px */
height: var(--app-stable-viewport-height, var(--tg-initial-height, 100vh));
```

Это означает, что при открытии клавиатуры body остаётся 844px, хотя viewport стал 508px.

## Исправленный globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  width: 100%;
  /* ⚡ Используем динамическую высоту viewport */
  height: var(--tg-viewport-height, 100vh);
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  /* Фиксируем для iOS */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
    to bottom,
    transparent,
    rgb(var(--background-end-rgb))
  ) rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Убери body.keyboard-open - больше не нужен */
```


## Исправленный ChatInterface — главный контейнер

Покажи полный JSX return, но вот что должно быть:

```tsx
return (
  <div 
    className="flex flex-col chat-interface"
    style={{
      height: 'var(--tg-viewport-height, 100vh)',
      maxHeight: 'var(--tg-viewport-height, 100vh)',
      overflow: 'hidden',
    }}
  >
    {/* Header */}
    <header 
      className="shrink-0 flex items-center px-4"
      style={{
        paddingTop: 'var(--tg-content-safe-area-inset-top, 46px)',
        minHeight: 'calc(44px + var(--tg-content-safe-area-inset-top, 46px))',
      }}
    >
      {/* header content */}
    </header>

    {/* Messages - ⚡ КРИТИЧНО: minHeight: 0 */}
    <div 
      className="flex-1 overflow-y-auto overflow-x-hidden px-4"
      style={{ minHeight: 0 }}
    >
      {messages.map(...)}
      <div ref={messagesEndRef} />
    </div>

    {/* Input */}
    <div 
      className="shrink-0 px-4 py-3"
      style={{
        paddingBottom: 'calc(12px + var(--tg-safe-area-inset-bottom, 0px))',
      }}
    >
      <input ... />
    </div>
  </div>
);
```


## Ключевые изменения

| Что | Было | Стало |
| :-- | :-- | :-- |
| body height | `--tg-initial-height` (844px всегда) | `--tg-viewport-height` (динамическая) |
| body position | не указан | `fixed` |
| Messages container | без minHeight | `minHeight: 0` |
| Класс keyboard-open | нужен | **не нужен** |

`minHeight: 0` критичен для flex children — без него `flex-1` не сжимает контейнер меньше его контента.[^2]
<span style="display:none">[^3]</span>

<div align="center">⁂</div>

[^1]: globals.css

[^2]: ChatInterface.tsx

[^3]: SafeAreaProvider.tsx

