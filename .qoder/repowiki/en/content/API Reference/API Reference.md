# API Reference

<cite>
**Referenced Files in This Document**  
- [init.ts](file://passion/src/core/init.ts)
- [i18n.ts](file://passion/src/core/i18n/i18n.ts)
- [provider.tsx](file://passion/src/core/i18n/provider.tsx)
- [config.ts](file://passion/src/core/i18n/config.ts)
- [types.ts](file://passion/src/core/i18n/types.ts)
- [Page.tsx](file://passion/src/components/Page.tsx)
- [DisplayData.tsx](file://passion/src/components/DisplayData/DisplayData.tsx)
- [Link.tsx](file://passion/src/components/Link/Link.tsx)
- [RGB.tsx](file://passion/src/components/RGB/RGB.tsx)
- [Root.tsx](file://passion/src/components/Root/Root.tsx)
- [LocaleSwitcher.tsx](file://passion/src/components/LocaleSwitcher/LocaleSwitcher.tsx)
</cite>

## Table of Contents
1. [Initialization API](#initialization-api)
2. [Component APIs](#component-apis)
3. [Internationalization (i18n) API](#internationalization-i18n-api)
4. [Integration with Telegram WebApp SDK](#integration-with-telegram-webapp-sdk)
5. [Reactivity and Signal Patterns](#reactivity-and-signal-patterns)
6. [Error Handling and Edge Cases](#error-handling-and-edge-cases)

## Initialization API

The `init` function is the primary entry point for initializing the application and configuring its integration with the Telegram Mini Apps environment. It sets up debugging, theme handling, viewport management, and optional mocking for macOS clients.

### Function Signature
```typescript
async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void>
```

### Parameters
- **debug**: When `true`, enables debug mode in the `@tma.js/sdk-react` library, providing additional console logs and runtime checks.
- **eruda**: If `true`, dynamically imports and initializes the Eruda debugging console, positioned in the top-right corner of the screen.
- **mockForMacOS**: Enables workaround behavior for known bugs in Telegram for macOS, such as unresponsive theme requests and incorrect safe area reporting. When enabled, it simulates responses to `web_app_request_theme` and `web_app_request_safe_area` events.

### Behavior
- Initializes the Telegram Apps SDK.
- Conditionally loads Eruda for debugging.
- Applies macOS-specific mocks if requested.
- Mounts essential UI components (BackButton, MiniApp, Viewport).
- Binds theme and viewport parameters to CSS variables for real-time styling.

**Section sources**
- [init.ts](file://passion/src/core/init.ts#L20-L83)

## Component APIs

This section documents the public components exported from `src/components/`, including their props, types, and usage patterns.

### Page
A layout component that controls the visibility and behavior of the Telegram Back Button.

#### Props
| Property | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `children` | ReactNode | Yes | - | Content to render inside the page. |
| `back` | boolean | No | `true` | Controls whether the back button is shown and functional. |

#### Usage
When `back={true}`, the Back Button is displayed and bound to `router.back()`. When `false`, it is hidden.

```tsx
<Page back={false}>Home Screen</Page>
```

**Section sources**
- [Page.tsx](file://passion/src/components/Page.tsx#L7-L31)

### DisplayData
Renders a structured list of key-value pairs using `@telegram-apps/telegram-ui` components.

#### Props
| Property | Type | Required | Description |
|--------|------|----------|-------------|
| `header` | ReactNode | No | Optional header for the section. |
| `rows` | `DisplayDataRow[]` | Yes | Array of data rows to display. |

#### DisplayDataRow Types
- `{ title: string; type: 'link'; value?: string }` – Renders a clickable link.
- `{ title: string; value: ReactNode }` – Renders arbitrary content, with special handling for strings (RGB colors), booleans (checkboxes), and undefined values.

#### Styling
Uses BEM-based CSS modules via `bem('display-data')`. Each row uses the `display-data__line` class, and values use `display-data__line-value`.

**Section sources**
- [DisplayData.tsx](file://passion/src/components/DisplayData/DisplayData.tsx#L13-L61)

### Link
An enhanced link component that integrates with Next.js routing and Telegram’s `openLink` API.

#### Props
Extends `NextLinkProps` and standard anchor attributes. Automatically detects external URLs and uses `openLink` to open them in the Telegram browser.

#### Behavior
- Internal links use Next.js routing.
- External links trigger `openLink(url)` and prevent default navigation.
- Applies the `link` CSS class for consistent styling.

**Section sources**
- [Link.tsx](file://passion/src/components/Link/Link.tsx#L16-L59)

### RGB
Displays a color swatch and its hex/RGB value.

#### Props
| Property | Type | Required | Description |
|--------|------|----------|-------------|
| `color` | RGBType (string) | Yes | Valid RGB color string (e.g., `#ff0000`, `rgb(255,0,0)`). |
| `className` | string | No | Additional CSS classes. |

#### Styling
Uses `bem('rgb')` for BEM structure. The color swatch is rendered as an `<i>` element with inline `backgroundColor`.

**Section sources**
- [RGB.tsx](file://passion/src/components/RGB/RGB.tsx#L11-L21)

### Root
The root application component that sets up the Telegram UI environment and error boundaries.

#### Props
| Property | Type | Required | Description |
|--------|------|----------|-------------|
| `children` | ReactNode | Yes | Application content. |

#### Functionality
- Uses `useSignal` to reactively track `miniApp.isDark` and `initData.user`.
- Sets the user locale based on language code.
- Wraps the app in `TonConnectUIProvider` and `AppRoot` from Telegram UI.
- Implements client-side mounting detection to avoid SSR issues.

**Section sources**
- [Root.tsx](file://passion/src/components/Root/Root.tsx#L45-L59)

### LocaleSwitcher
A UI control for switching between available locales.

#### Props
None. Uses `useLocale()` from `next-intl` to get the current locale.

#### Behavior
- Renders a `<Select>` with options for 'en' and 'ru'.
- On change, calls `setLocale(locale)` to update the application language.
- Driven by `localesMap` from `i18n/config`.

**Section sources**
- [LocaleSwitcher.tsx](file://passion/src/components/LocaleSwitcher/LocaleSwitcher.tsx#L11-L27)

## Internationalization (i18n) API

The application uses `next-intl` for localization, with support for English and Russian.

### useTranslations
Hook from `next-intl` used to access localized strings.

#### Return Value
A function `t(key: string)` that returns the localized message for the given key.

#### Example
```tsx
const t = useTranslations('i18n');
return <Section header={t('header')} />;
```

**Section sources**
- [i18n.ts](file://passion/src/core/i18n/i18n.ts#L7-L19)
- [config.ts](file://passion/src/core/i18n/config.ts#L1-L11)

### Locale Management
- Default locale is `'en'`.
- Supported locales: `'en'`, `'ru'`.
- Locale is set via `setLocale(locale)` and stored in a module-level variable.
- Messages are loaded dynamically from `public/locales/*.json`.

**Section sources**
- [locale.ts](file://passion/src/core/i18n/locale.ts)
- [types.ts](file://passion/src/core/i18n/types.ts#L3-L5)

## Integration with Telegram WebApp SDK

All components and initialization logic integrate tightly with the Telegram Mini Apps SDK (`@tma.js/sdk-react`).

### Key Integrations
- **Back Button**: Controlled via `backButton.show()`/`hide()` and `backButton.onClick()`.
- **Theme Parameters**: Bound to CSS variables using `bindThemeParamsCssVars()`.
- **Viewport**: Managed via `mountViewport()` and `bindViewportCssVars()`.
- **Init Data**: Restored using `restoreInitData()` and accessed via `useSignal(initData.user)`.
- **TON Connect**: Integrated via `TonConnectUIProvider` and `useTonWallet()`.

### Platform Detection
The `Root` component detects platform (`macos`, `ios`) and adjusts the UI platform accordingly.

**Section sources**
- [init.ts](file://passion/src/core/init.ts#L3-L82)
- [Root.tsx](file://passion/src/components/Root/Root.tsx#L36-L37)

## Reactivity and Signal Patterns

The application uses signal-based reactivity from `@tma.js/sdk-react`.

### useSignal
Wraps reactive values from the SDK (e.g., `miniApp.isDark`, `initData.user`) into React state.

#### Example
```tsx
const isDark = useSignal(miniApp.isDark);
```
This ensures the component re-renders when the underlying signal changes.

### useEffect Integration
Signals are used within `useEffect` dependencies to respond to changes (e.g., updating locale when `initData.user` changes).

**Section sources**
- [Root.tsx](file://passion/src/components/Root/Root.tsx#L23-L29)

## Error Handling and Edge Cases

### ErrorBoundary
Wraps the app in `ErrorBoundary` to catch and display errors gracefully using `ErrorPage`.

### Conditional Rendering
- `DisplayData` handles `undefined` values by rendering `<i>empty</i>`.
- `TONConnectPage` conditionally renders based on wallet connection state.
- `Root` shows a loading indicator during SSR to prevent hydration mismatches.

### Edge Cases
- **macOS Client Bugs**: Mitigated via `mockForMacOS` option in `init`.
- **Missing Init Data**: Gracefully handled by conditional checks.
- **External Link Handling**: Prevents default navigation and uses `openLink`.

**Section sources**
- [Root.tsx](file://passion/src/components/Root/Root.tsx#L51-L57)
- [TONConnectPage.tsx](file://passion/src/app/ton-connect/page.tsx#L27-L45)
- [DisplayData.tsx](file://passion/src/components/DisplayData/DisplayData.tsx#L29-L31)