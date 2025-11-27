# Implementation Plan: Passion Bot Integration

## Goal
Integrate the existing `passion-bot` logic (`bot-core`) into the `passion` Next.js application. This involves porting the bot logic to API routes and creating a frontend interface in the Mini App to interact with the bot.

## User Review Required
> [!IMPORTANT]
> **Environment Variables**: I will create a `.env.local` file structure. You will need to populate it with your `BOT_TOKEN`, `OPENROUTER_API_KEY`, and a new `WEBHOOK_SECRET`.
> **Session Storage**: For this implementation, I will use `FileAdapter` as in the original bot, which works for local development. For production (Vercel), you will need to switch to a database (e.g., Vercel KV or MongoDB).

## Existing Implementation Status
- **Project Structure**: Next.js app initialized in `passion/`.
- **UI Components**:
    - `passion/app/page.tsx`: Contains the main layout with background, icons (Broom, Flash, Home, etc.), and safe area handling. It is currently a static shell.
    - `passion/src/components/Page.tsx`: An alternative/duplicate component (likely from Figma export), but `app/page.tsx` seems to be the active one.
    - `passion/app/providers.tsx`: SDK, SafeArea, and DebugConsole providers are already set up.
    - `passion/app/layout.tsx`: Root layout with Telegram script.
- **Missing**:
    - **Backend**: No bot logic, no API routes.
    - **Frontend Logic**: No chat interface, no avatar selection, no state management.

## Proposed Changes

### 1. Dependencies & Configuration
#### [MODIFY] [package.json](file:///Users/macintosh/development/Passion-bot-2/passion/package.json)
- Add `grammy`, `@grammyjs/storage-file`.
- `@tma.js/sdk` and `@tma.js/sdk-react` are already installed.

#### [NEW] [.env.local](file:///Users/macintosh/development/Passion-bot-2/passion/.env.local)
- Template for environment variables.

### 2. Backend (Bot Logic)
#### [NEW] [passion/src/lib/bot/prompts.ts](file:///Users/macintosh/development/Passion-bot-2/passion/src/lib/bot/prompts.ts)
- Port `AVATARS` and prompts from `bot-core/prompts.js`.

#### [NEW] [passion/src/lib/bot/bot.ts](file:///Users/macintosh/development/Passion-bot-2/passion/src/lib/bot/bot.ts)
- Initialize `Bot` instance.
- Port logic:
    - Session middleware (using `FileAdapter`).
    - Command handlers (`/start`, `/clear`).
    - Message handler (OpenRouter integration).
    - Message splitting logic.
- Export `bot` instance.

#### [NEW] [passion/app/api/bot/route.ts](file:///Users/macintosh/development/Passion-bot-2/passion/app/api/bot/route.ts)
- Webhook handler using `webhookCallback`.
- Verify `X-Telegram-Bot-Api-Secret-Token`.

#### [NEW] [passion/app/api/chat/route.ts](file:///Users/macintosh/development/Passion-bot-2/passion/app/api/chat/route.ts)
- Endpoint for the Mini App to send messages and get AI responses directly.

### 3. Frontend (Mini App)
#### [NEW] [passion/src/components/ChatInterface.tsx](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/ChatInterface.tsx)
- Component to display chat history and input field.
- Will use the existing visual style (backgrounds, glassmorphism) from `app/page.tsx`.

#### [NEW] [passion/src/components/AvatarSelection.tsx](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/AvatarSelection.tsx)
- UI for selecting the avatar.
- Will use the existing visual style.

#### [MODIFY] [passion/app/page.tsx](file:///Users/macintosh/development/Passion-bot-2/passion/app/page.tsx)
- **Refactor**: Move the static layout into a wrapper or keep it as the main shell.
- **State**: Add state for `view` (selection | chat).
- **Integration**: Render `AvatarSelection` or `ChatInterface` inside the "Main Content Area".
- **Cleanup**: Remove unused code if necessary, but keep the visual fidelity (icons, gradients).

## Verification Plan

### Automated Tests
- **Type Check**: `tsc --noEmit` in `passion/`.
- **Lint**: `npm run lint`.

### Manual Verification
1.  **Setup**:
    -   Fill `.env.local`.
    -   Run `npm run dev`.
    -   Run `ngrok http 3000`.
    -   Set Webhook.
2.  **Mini App**:
    -   Open Mini App.
    -   Verify Avatar Selection works.
    -   Verify Chat Interface sends messages and receives AI responses.
3.  **Bot (Telegram)**:
    -   Verify `/start` and `/clear` work in Telegram.
