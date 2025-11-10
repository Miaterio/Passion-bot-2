<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Я создал новый проект по этой инструкции [https://docs.telegram-mini-apps.com/packages/tma-js-create-mini-app](https://docs.telegram-mini-apps.com/packages/tma-js-create-mini-app) , но у меня проблема с тем что при просмотре через Telegram Mini App в режиме Full Screen (Full Size) встроенные вехние элементы Telegram перекрывают контент, и вообще сам контент уходит даже под статус бар самого телефона, я знаю что проблемы с safe-area-inset и content-safe-area-inset, но никак не могу нормально их настроить.

Добавлю больше технических деталей насчет стека на котором я работаю: TypeScript, Next.js и @tma.js/sdk

Найди всю возможную информацию по этому поводу.

Так же прикладываю гайд в формате markdown из еще одного источника, дополнительно проверь насколько в нем правильная и правдивая информация.

Now I have comprehensive information about the safe area issues in Telegram Mini Apps. Let me create a detailed response with practical solutions for the user.

## Решение проблем с Safe Area и Content Safe Area в Telegram Mini App (Next.js, TypeScript, @tma.js/sdk)

### Основная проблема и её причина

Проблема, с которой вы столкнулись, является **классической для Telegram Mini Apps на iOS в режиме fullscreen**. Когда приложение переходит в полноэкранный режим, WebView растягивается на весь экран, но **стандартные CSS-переменные `env(safe-area-inset-*)`** перестают работать корректно, возвращая значение `0`, потому что Telegram не пробрасывает их стандартным образом через свой WebView.[^1][^2]

Существует два типа отступов, которыми оперирует Telegram:


| Параметр | Описание |
| :-- | :-- |
| **safeAreaInset**[^3][^4] | Отступы, учитывающие только системные области устройства (вырез/notch, статус-бар, home indicator) |
| **contentSafeAreaInset**[^3][^4] | Отступы, учитывающие как системные области, так и интерфейс самого Telegram (верхняя панель, нижние элементы) |

Для fullscreen режима на iOS **необходимо использовать `contentSafeAreaInset`**, так как он гарантирует, что контент не будет перекрыт ничем сверху и снизу.[^1]

### Полный гайд по настройке (с вашим стеком)

#### Шаг 1: Правильный meta viewport в `app/layout.tsx`

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Ключевой параметр**: `viewport-fit=cover` позволяет приложению занять весь экран, включая области вокруг выреза.[^5][^1]

#### Шаг 2: Инициализация SDK и привязка CSS-переменных

Создайте client-компонент для инициализации (например, `app/TMAInitializer.tsx`):

```typescript
'use client'

import { useEffect } from 'react'
import { init, viewport, miniApp } from '@tma.js/sdk'

export function TMAInitializer() {
  useEffect(() => {
    try {
      // Инициализация SDK
      const app = init()

      // Синхронная инициализация miniApp
      if (miniApp.mountSync?.isAvailable?.()) {
        miniApp.mountSync()
      }

      // Привязка CSS-переменных viewport
      if (viewport.bindCssVars?.isAvailable?.()) {
        viewport.bindCssVars()
      }

      // Расширение viewport
      if (viewport.expand?.isAvailable?.()) {
        viewport.expand()
      }

      // Переход в fullscreen
      if (viewport.requestFullscreen?.isAvailable?.()) {
        viewport.requestFullscreen().catch(() => {
          // Fullscreen может быть недоступен на некоторых платформах
        })
      }

      // Сигнализируем приложению о готовности
      app.ready()
    } catch (error) {
      console.error('TMA initialization error:', error)
    }
  }, [])

  return null
}
```


#### Шаг 3: Компонент-обёртка для управления safe area

Создайте компонент `app/SafeAreaProvider.tsx`:

```typescript
'use client'

import { ReactNode } from 'react'

export function SafeAreaProvider({ children }: { children: ReactNode }) {
  return (
    <div className="safe-area-container">
      {children}
    </div>
  )
}
```

А в глобальных стилях (`app/globals.css`):

```css
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--tg-bg, #ffffff);
  color: var(--tg-text-color, #000000);
}

#__next {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.safe-area-container {
  width: 100%;
  height: 100%;
  
  /* Основной способ: используем CSS-переменные, которые привязал bindCssVars() */
  /* Важно: эти переменные обновляются автоматически при смене fullscreen/ориентации */
  padding-top: var(--tg-content-safe-area-inset-top, 0px);
  padding-bottom: var(--tg-content-safe-area-inset-bottom, 0px);
  padding-left: var(--tg-content-safe-area-inset-left, 0px);
  padding-right: var(--tg-content-safe-area-inset-right, 0px);

  /* Если переменные не доступны, fallback на другой метод */
  /* см. Шаг 4 ниже */
  
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}
```


#### Шаг 4: Альтернативный метод — динамическая установка через сигналы@tma.js/sdk

Если CSS-переменные почему-то не работают, используйте сигналы напрямую (client-компонент):

```typescript
'use client'

import { useEffect, useState } from 'react'
import { viewport } from '@tma.js/sdk'

export function DynamicSafeArea({ children }: { children: React.ReactNode }) {
  const [safeAreaStyle, setSafeAreaStyle] = useState({
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
  })

  useEffect(() => {
    // Функция обновления
    const updateSafeArea = () => {
      const insets = viewport.contentSafeAreaInsets?.()
      
      if (insets) {
        setSafeAreaStyle({
          paddingTop: `${insets.top}px`,
          paddingBottom: `${insets.bottom}px`,
          paddingLeft: `${insets.left}px`,
          paddingRight: `${insets.right}px`,
        })
      }
    }

    // Инициальное обновление
    updateSafeArea()

    // Подписываемся на изменения (при смене ориентации, fullscreen и т.д.)
    const unsubscribe = viewport.contentSafeAreaInsets?.sub?.(updateSafeArea)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <div style={safeAreaStyle} className="safe-area-container">
      {children}
    </div>
  )
}
```


#### Шаг 5: Обновлённая структура `app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { TMAInitializer } from './TMAInitializer'
import { SafeAreaProvider } from './SafeAreaProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Telegram Mini App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* Скрипт Telegram в head */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body>
        <TMAInitializer />
        <SafeAreaProvider>
          {children}
        </SafeAreaProvider>
      </body>
    </html>
  )
}
```


### Дополнительные рекомендации для iOS

#### 1. Контроль цвета шапки

Установите цвет заголовка, чтобы иконки статус-бара были видны:

```typescript
useEffect(() => {
  const { webApp } = init()
  webApp.setHeaderColor?.('#ffffff') // или цвет вашей темы
}, [])
```


#### 2. Отключение вертикального свайпа коллапса (API 7.7+)

Если обнаружите, что при свайпе вниз приложение коллапсируется:

```typescript
useEffect(() => {
  const { webApp } = init()
  webApp.disableVerticalSwipes?.()
}, [])
```


#### 3. CSS для фиксированных элементов внизу

Если у вас есть элементы, которые должны оставаться внизу (кнопки, навигация):

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  
  /* Очень важно! */
  padding-bottom: var(--tg-content-safe-area-inset-bottom, 0px);
  
  background: white;
  border-top: 1px solid #eee;
  z-index: 100;
}

/* Контент должен иметь отступ снизу, чтобы не уходить под nav */
.main-content {
  padding-bottom: calc(60px + var(--tg-content-safe-area-inset-bottom, 0px));
}
```


***

### Проверка гайда из приложенного файла

Ваш markdown-гайд **в целом правильный и актуальный**. Вот краткая оценка:


| Раздел | Статус | Комментарий |
| :-- | :-- | :-- |
| **Meta viewport**[^1] | ✅ Правильно | `viewport-fit=cover` — ключевой параметр |
| **safeAreaInset vs contentSafeAreaInset**[^1][^4] | ✅ Правильно | Правильно объяснена разница и что использовать для iOS |
| **env(safe-area-inset-*) не работают**[^1][^2] | ✅ Правильно | Это известная проблема Telegram, верное объяснение |
| **bindCssVars() и CSS-переменные**[^3][^6] | ✅ Верно | SDK создаёт переменные вида `--tg-viewport-*` |
| **События contentSafeAreaChanged**[^4] | ✅ Верно | События работают и должны быть обработаны |
| **Fullscreen и requestFullscreen**[^7] | ✅ Верно | Метод корректен |

**Одно замечание**: В гайде упоминаются переменные `--tg-content-safe-area-inset-*`, но в официальной документации SDK это не явно описано. Более надёжный способ — использовать **сигналы viewport.contentSafeAreaInsets()** напрямую или полагаться на то, что `bindCssVars()` создаёт стандартные переменные `--tg-viewport-*` и дополняет их другими при наличии.[^3][^6]

***

### Практические шаги для отладки

1. **Проверьте консоль DevTools** (в Chrome на ПК можно разобрать через Telegram Web K):

```typescript
useEffect(() => {
  const insets = viewport.contentSafeAreaInsets?.()
  console.log('Content Safe Area Insets:', insets)
}, [])
```

2. **Тестируйте на реальном iOS-устройстве** — эмуляторы иногда некорректно симулируют safe area
3. **Проверьте версию Telegram** — support contentSafeAreaInset добавлен в Bot API 8.0 (novembre 2024)[^4][^1]
4. **Используйте временный визуальный индикатор**:

```css
.safe-area-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--tg-content-safe-area-inset-top, 0px);
  background: rgba(255, 0, 0, 0.3);
  pointer-events: none;
  z-index: 9999;
}
```


Это покажет вам точный размер top-отступа, который применяет Telegram.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Telegram-Mini-App-Safe-Area-Guide.md

[^2]: https://github.com/TelegramMessenger/Telegram-iOS/issues/1377

[^3]: https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x/components/viewport

[^4]: https://docs.telegram-mini-apps.com/platform/events

[^5]: https://stackoverflow.com/questions/78929030/how-to-remove-bottom-gap-in-telegram-mini-app

[^6]: https://docs.telegram-mini-apps.com/packages/tma-js-sdk/features/viewport

[^7]: https://docs.telegram-mini-apps.com/platform/viewport

[^8]: https://docs.telegram-mini-apps.com/packages/tma-js-create-mini-app

[^9]: https://stackoverflow.com/questions/79414059/how-to-run-telegram-mini-app-in-full-screen-landscape-mode

[^10]: https://github.com/Telegram-Mini-Apps/telegram-apps/issues/694

[^11]: https://core.telegram.org/bots/webapps

[^12]: https://core.telegram.org/api/bots/webapps

[^13]: https://jsr.io/@tma/sdk/doc

[^14]: https://blog.logrocket.com/building-telegram-mini-apps-react/

[^15]: https://telegram.org/blog/fullscreen-miniapps-and-more

[^16]: https://peiko.space/blog/article/how-to-build-telegram-mini-apps/

[^17]: https://habr.com/ru/sandbox/254394/

[^18]: https://pub.dev/documentation/telegram_web_app/latest/telegram_web_app/ContentSafeAreaInset-class.html

[^19]: https://docs.telegram-mini-apps.com/packages/tma-js-signals

[^20]: https://habr.com/ru/articles/846516/

[^21]: https://t.me/s/MiniAppsForLife?q=%23инструкции

[^22]: https://docs.telegram-mini-apps.com/packages/tma-js-sdk/usage-tips

[^23]: https://forum.ionicframework.com/t/app-doesnt-extend-to-full-screen-use-safe-area-inset-for-notch/213384

[^24]: https://github.com/vkruglikov/react-telegram-web-app

[^25]: https://dev.to/nimaxin/how-to-fix-the-telegram-mini-app-scrolling-collapse-issue-a-handy-trick-1abe

[^26]: https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react/1-x

[^27]: https://github.com/TelegramMessenger/Telegram-iOS/issues/1302

[^28]: https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/1-x/components/viewport

[^29]: https://github.com/ionic-team/ionic-framework/issues/17927

[^30]: https://www.youtube.com/watch?v=oHUNLuEtqQ0

[^31]: https://docs.expo.dev/develop/user-interface/safe-areas/

[^32]: https://doka.guide/css/env/

[^33]: https://stackoverflow.com/questions/46829840/get-safe-area-inset-top-and-bottom-heights

[^34]: https://github.com/Telegram-Mini-Apps/telegram-apps/issues/553

