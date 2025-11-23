# Migration Plan: Passion Bot to Next.js

## Goal
Migrate the existing `passion-bot` functionality to a unified **Next.js 16** application (`passion/`) as specified in `TECHNICAL_DOCUMENTATION.md`. The new app will handle both the Telegram Mini App frontend and the Bot backend (via API routes).

**Source of Truth**:
- **Bot Logic**: `passion-bot/bot-core/` (contains `bot.js`, `prompts.js`)
- **UI/Frontend**: Built from scratch using Next.js + Tailwind CSS (NOT ported from old `webapp/`)

## User Review Required
> [!IMPORTANT]
> **Architecture Change**: The Bot logic will move from a standalone `bot.js` process to a Next.js API Route (`/api/bot`) using Webhooks. This requires setting up a public URL (ngrok/Vercel) and configuring the webhook with Telegram. Long polling will be replaced by Webhooks for the production deployment, though we can still run a polling script for local dev if preferred (but Webhooks are cleaner with Next.js).

> [!WARNING]
> **Session Storage**: The current `sessions/sessions.json` file storage works for a single persistent process. In a Serverless/Next.js environment, file storage is ephemeral.
> **Proposal**: For this migration, we will use a simple **JSON file storage** (assuming local dev or VPS deployment) or **Vercel KV / MongoDB** if deployment to Vercel is intended.
> *Decision*: We will stick to `FileAdapter` for now (assuming local/VPS run), but wrap it carefully. If Vercel deployment is a must, we need a database.

## Security Requirements

> [!CAUTION]
> **CRITICAL: API Keys Compromised!** The current `bot.js` contains hardcoded tokens that are now publicly visible. These must be rotated immediately before migration:
> - Revoke and regenerate `BOT_TOKEN` via @BotFather
> - Revoke and regenerate `OPENROUTER_API_KEY` via OpenRouter dashboard

### 1. Environment Variables
- Create `.env.local` in `passion/` (NEVER commit this file)
- Add to `.gitignore`: `.env.local`, `.env*.local`
- Required variables:
  ```bash
  BOT_TOKEN=your_new_bot_token
  OPENROUTER_API_KEY=your_new_openrouter_key
  WEBHOOK_SECRET=random_secure_string_min_32_chars
  ```

### 2. Webhook Security
**Problem**: Without validation, anyone can send fake updates to `/api/bot`.

**Solution**: Implement secret token validation in `app/api/bot/route.ts`:
```typescript
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;
const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

if (headerSecret !== WEBHOOK_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

When setting webhook:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/bot",
    "secret_token": "your_webhook_secret"
  }'
```

### 3. Session Storage Strategy
**Problem**: `FileAdapter` doesn't work in Vercel (ephemeral filesystem).

**Decision Required**:
- **Option A (VPS Deployment)**: Keep `FileAdapter`, deploy to persistent server
- **Option B (Vercel Deployment)**: Use **Vercel KV** (Redis-based):
  ```typescript
  import { kv } from '@vercel/kv';
  // Custom storage adapter for Grammy
  ```

### 4. Rate Limiting
Implement rate limiting to prevent abuse:
- **Per-user limit**: 10 messages per minute
- **Global limit**: 100 requests per minute to `/api/bot`

**Implementation** (using Upstash Rate Limit):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

### 5. Input Sanitization
- Validate all user inputs before sending to OpenRouter API
- Limit message length (max 4000 characters)
- Strip potentially malicious content

### 6. Content Security Policy
Add to `next.config.ts`:
```typescript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org;"
      }
    ]
  }
]
```

## Proposed Changes

### 1. Project Initialization
#### [NEW] `passion/`
- Initialize Next.js 16 app.
- Configure Tailwind CSS v4.
- Install `@tma.js/sdk`, `@tma.js/sdk-react`, `grammy`, `@grammyjs/storage-file`.
- **Security Setup**:
  - Create `.env.local` with rotated API keys
  - Update `.gitignore` to exclude environment files
  - Install `@upstash/ratelimit` and `@vercel/kv` (if using Vercel)

### 2. Backend (Bot Logic)
#### [NEW] `passion/src/lib/bot/`
- `bot.ts`: Initialize `Bot` instance, middleware, and command handlers. Port logic from `passion-bot/bot-core/bot.js`.
- `prompts.ts`: Port character prompts from `passion-bot/bot-core/prompts.js`.
- `session.ts`: Configure session storage.

#### [NEW] `passion/app/api/bot/route.ts`
- Webhook handler for Telegram updates.
- Uses `webhookCallback` from `grammy`.
- **Security**:
  - Validate `X-Telegram-Bot-Api-Secret-Token` header
  - Implement rate limiting middleware
  - Add request logging for security audit

#### [NEW] `passion/src/lib/ai.ts`
- Port `generateAIResponse` logic (OpenRouter API calls).

### 3. Frontend (Mini App)
#### [NEW] `passion/app/providers.tsx`
- Implement `SDKProvider` and `SafeAreaProvider`.
- Initialize Telegram SDK (`init`, `viewport.expand`, `swipeBehavior.disableVertical`).

#### [NEW] `passion/src/components/`
- `ChatInterface.tsx`: Re-implement chat logic (messages, input) using new UI components.
- `AvatarSelection.tsx`: Re-implement avatar selection using new UI components.
- `Navigation.tsx`: Implement new navigation menu.

#### [NEW] `passion/app/page.tsx`
- Main entry point. Checks user state (age/avatar) and renders appropriate component.

## Verification Plan

### Automated Tests
- **Linting**: Run `npm run lint` in `passion/`.
- **Type Check**: Run `tsc --noEmit`.
- **Security Audit**: Run `npm audit` to check for vulnerable dependencies.

### Manual Verification
1.  **Security Pre-flight**:
    -   ✅ Confirm old API keys are revoked
    -   ✅ Verify `.env.local` is in `.gitignore`
    -   ✅ Test webhook endpoint returns 401 without valid secret token
    -   ✅ Verify no secrets are committed to git: `git log -p | grep -E "(BOT_TOKEN|API_KEY|SECRET)"`

2.  **Bot Startup**:
    -   Start Next.js dev server: `npm run dev`.
    -   Start ngrok: `ngrok http 3000`.
    -   Set webhook with secret token:
        ```bash
        curl -X POST "https://api.telegram.org/bot<NEW_TOKEN>/setWebhook" \
          -H "Content-Type: application/json" \
          -d '{"url": "<NGROK_URL>/api/bot", "secret_token": "<WEBHOOK_SECRET>"}'
        ```
    -   Send `/start` to the bot in Telegram. Verify it replies.
    -   **Security Test**: Try sending a POST request to `/api/bot` without the secret header → should return 401

3.  **Mini App Launch**:
    -   Open the Mini App via the Menu button or Attachment menu.
    -   Verify it loads without errors.
    -   Verify **Safe Area** (top bar shouldn't overlap content).
    -   Verify **Scrolling** (no app collapse on scroll).

4.  **Chat Flow**:
    -   Select an avatar.
    -   Send a message.
    -   Verify AI response is generated and displayed.
    -   **Security Test**: Try sending 20 messages rapidly → should be rate-limited after 10

5.  **Session Persistence**:
    -   Send messages, close app, reopen → verify history is preserved
    -   If using Vercel: Deploy and test sessions persist across deployments
