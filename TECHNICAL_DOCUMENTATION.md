# Technical Documentation: Passion Bot 2 (Telegram Mini App)

## 1. Project Overview

**Passion Bot 2** is a Telegram Mini App built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**. It leverages the **@tma.js/sdk v3** for deep integration with the Telegram client, providing a native-like experience.

### Tech Stack
-   **Framework**: Next.js 16 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS v4, CSS Variables
-   **Telegram SDK**: `@tma.js/sdk` v3, `@tma.js/sdk-react`
-   **UI Components**: Custom components + `@telegram-apps/telegram-ui`
-   **State Management**: React Context + Hooks
-   **Debugging**: `eruda` (mobile console), Custom Debug Overlay

## 2. Project Structure

The project follows a hybrid structure with the main application logic in `app/` and reusable components in `src/`.

```
passion/
├── app/                    # Next.js App Router (Routes & Layouts)
│   ├── layout.tsx          # Root Layout (Viewport, Fonts, Scripts)
│   ├── page.tsx            # Home Page
│   ├── providers.tsx       # TMA SDK Initialization & Context Wrappers
│   └── globals.css         # Global Styles & Tailwind Directives
├── src/
│   ├── components/         # Reusable UI Components
│   │   ├── SafeAreaProvider/ # Custom Safe Area Logic
│   │   ├── DebugConsole/     # On-screen Debugger
│   │   └── ...
│   └── core/               # Core utilities (if any)
├── public/                 # Static Assets
├── next.config.ts          # Next.js Configuration
└── package.json            # Dependencies & Scripts
```

## 3. Key Technical Implementations

### 3.1. Telegram SDK Initialization (`providers.tsx`)
The `Providers` component (`app/providers.tsx`) is the entry point for the Telegram Mini App logic. It handles:
1.  **Initialization**: Calls `init()` from `@tma.js/sdk`.
2.  **Viewport Management**: Mounts and expands the viewport to full screen (`viewport.expand()`).
3.  **Swipe Behavior**: Disables vertical swipes (`swipeBehavior.disableVertical()`) to prevent the Mini App from collapsing when scrolling, ensuring a native app feel.
4.  **Safety Checks**: Wraps initialization in `try-catch` blocks to handle running outside the Telegram environment (e.g., local browser).

### 3.2. Safe Area Handling
Safe areas (notches, home indicators) are critical for Mini Apps.
-   **Configuration**: `layout.tsx` sets `viewportFit: "cover"` in the viewport export.
-   **Implementation**: The `SafeAreaProvider` (`src/components/SafeAreaProvider`) calculates and exposes safe area insets.
-   **CSS Variables**: Safe areas are likely exposed as CSS variables (e.g., `--tg-safe-area-inset-top`) to allow components to adapt their layout dynamically.

### 3.3. Layout & Styling
-   **Font**: Uses `Geist` and `Geist Mono` via `next/font`.
-   **Tailwind**: Configured for utility-first styling.
-   **Global Styles**: `globals.css` handles basic resets and Telegram theme variable integration (e.g., `var(--tg-theme-bg-color)`).

### 3.4. Debugging
-   **DebugConsole**: A custom component included in `Providers` to show logs and status directly on the mobile screen, which is essential for debugging on physical devices where DevTools aren't available.

## 4. Getting Started

### Prerequisites
-   Node.js (v18+ recommended)
-   npm, yarn, pnpm, or bun

### Installation
```bash
cd passion
npm install
```

### Development
To run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Testing in Telegram
To test inside Telegram:
1.  Run the local server: `npm run dev`
2.  Expose the port (3000) using a tunnel service like **ngrok**:
    ```bash
    ngrok http 3000
    ```
3.  Use the generated HTTPS URL to configure your Mini App in BotFather or use a direct link.

## 5. Deployment
The project is optimized for Vercel deployment but can be hosted on any platform supporting Next.js.
```bash
npm run build
npm start
```
