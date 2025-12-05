# Session Summary - December 3, 2024

## Objective
Fix the "jump" animation in the Telegram Mini App chat interface when the iOS keyboard opens. The entire chat container was visually sliding up from the bottom of the screen, creating a jarring user experience.

**Expected Behavior:**
- Header should remain fixed in place
- Input field should smoothly rise above the keyboard
- No container "slide up" animation

## Problem Analysis

### Root Cause
When the iOS keyboard opens in Telegram WebView:
1. `window.innerHeight` changes from 844px to 508px
2. Document scroll event occurs (`scrollY: 336px`)
3. The browser attempts to scroll the document to bring the input field into view
4. This creates a visible "jump" animation of the entire interface

### Key Findings
- `--tg-viewport-stable-height` CSS variable changes from 844px to 508px
- Despite CSS `overflow: hidden`, iOS Safari WebView still triggers scroll events
- `position: fixed` on `<body>` element doesn't apply in Telegram WebView (iOS limitation)
- `computedPosition: static` persisted even with `position: fixed !important`

## Solutions Attempted

### Phase 1: Header Positioning (FAILED)
**Approach:** Made header `position: fixed` to prevent it from moving
**Result:** Header stayed fixed, but entire container still animated

### Phase 2: Viewport Height Constraints (FAILED)
**Approach:** Constrained document height using `--tg-viewport-stable-height`
**Changes:**
- Modified [`page.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/page.tsx): Changed `min-h-screen` to `h-[var(--tg-viewport-stable-height,100vh)]`
- Modified [`Page.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/Page.tsx): Changed to `h-full`

**Result:** Container still animated due to document scroll

### Phase 3: Scroll Prevention Attempts (FAILED)
Multiple approaches to prevent document scrolling:

**3.1. CSS Overflow Hidden**
```css
html, body {
    overflow: hidden !important;
    position: fixed;
    height: 100%;
}
```
**Result:** Scroll events still occurred

**3.2. JavaScript Scroll Lock**
Created [`useScrollLock.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useScrollLock.ts) hook:
- Forced `window.scrollTo(0, 0)` on every scroll event
- Used `{ passive: false }` event listeners
- Monitored visual viewport resize/scroll

**Result:** Scroll was reverted immediately, but visual jump still occurred

**3.3. Body Height Fixation**
Created [`useFixedBodyHeight.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useFixedBodyHeight.ts):
- Set explicit `body.style.height` to initial `window.innerHeight`
- Used `!important` flags

**Result:** `body` height changed anyway (iOS WebView limitation)

**3.4. Position Absolute + Inset**
```css
html, body {
    position: absolute;
    inset: 0;
}
```
**Result:** Still showed `computedPosition: static` in logs

**3.5. Wrapper Div Approach**
Added `position: fixed` wrapper div in [`layout.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/layout.tsx):
```tsx
<body>
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {children}
    </div>
</body>
```
**Result:** No change in behavior

### Phase 4: Viewport Meta Tag Enhancement (PARTIAL SUCCESS)
Added to [`layout.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/layout.tsx):
```tsx
viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    interactiveWidget: 'resizes-content',
}
```

**Result:** `interactiveWidget: 'resizes-content'` helped browser understand keyboard behavior, but scroll issue persisted

### Final Solution: Scroll-Independent Layout (CURRENT)

**Philosophy:** Instead of fighting the browser's scroll behavior, make the layout independent of scrolling.

**Approach:**
1. **Removed all scroll blocking attempts**
   - No `position: fixed` on body
   - No `overflow: hidden`
   - No JavaScript scroll prevention
   - Removed `useScrollLock` hook

2. **Changed ChatInterface to `position: absolute`**
   - Container positioned absolutely from top: 0
   - Uses `minHeight: 100vh` for height
   - Not tied to viewport, so scroll doesn't affect visual position

3. **Allowed natural document scroll**
   - Browser can scroll document as needed
   - Scroll happens "behind" the absolute-positioned interface
   - User doesn't see the scroll effect

**Implementation:**

[`globals.css`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/globals.css):
```css
html, body {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    overscroll-behavior: none;
}
```

[`ChatInterface.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/ChatInterface.tsx):
```tsx
<div
    className="absolute left-0 right-0 w-full overflow-hidden flex flex-col"
    style={{
        top: 0,
        minHeight: '100vh',
        zIndex: 50,
        transition: 'none',
    }}
>
```

## Supporting Features Added

### 1. Enhanced Diagnostics
Created [`useKeyboardDiagnostics.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useKeyboardDiagnostics.ts):
- Logs viewport dimensions, scroll position, CSS variables
- Monitors RESIZE, SCROLL, FOCUS, BLUR, MUTATION events
- Logs Telegram SDK viewport changes
- Tracks body computed styles
- Provides detailed snapshots at FOCUS+50ms, +200ms, +500ms, +1000ms, +1500ms

### 2. Console Log Copy Feature
Created [`useConsoleCopy.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useConsoleCopy.ts):
- Intercepts all console.log calls
- Stores logs with timestamps
- Provides copy-to-clipboard functionality
- Uses Telegram WebApp clipboard API
- Added floating debug buttons (dev mode only)

### 3. Debug UI
Added to [`ChatInterface.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/ChatInterface.tsx):
- "Copy Logs" button with log counter badge
- "Clear Logs" button
- Only visible in development mode
- Positioned as floating buttons bottom-right

## Files Modified

### Primary Changes
- [`/passion/src/app/globals.css`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/globals.css) - Removed scroll blocking, simplified CSS
- [`/passion/src/app/layout.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/layout.tsx) - Added viewport meta tag, removed wrapper div
- [`/passion/src/components/ChatInterface.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/ChatInterface.tsx) - Changed to absolute positioning, integrated debug tools

### New Files Created
- [`/passion/src/hooks/useScrollLock.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useScrollLock.ts) - Scroll prevention hook (currently unused)
- [`/passion/src/hooks/useKeyboardDiagnostics.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useKeyboardDiagnostics.ts) - Diagnostic logging
- [`/passion/src/hooks/useConsoleCopy.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useConsoleCopy.ts) - Console log management
- [`/passion/src/hooks/useFixedBodyHeight.ts`](file:///Users/macintosh/development/Passion-bot-2/passion/src/hooks/useFixedBodyHeight.ts) - Body height fixation (currently unused)

### Previously Modified (Earlier Sessions)
- [`/passion/src/app/page.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/app/page.tsx)
- [`/passion/src/components/Page.tsx`](file:///Users/macintosh/development/Passion-bot-2/passion/src/components/Page.tsx)

## Key Learnings

### iOS WebView Limitations
1. **Cannot enforce `position: fixed` on `<body>`** - iOS Safari WebView ignores this, even with `!important`
2. **Cannot prevent scroll events** - Even with `overflow: hidden`, scroll events fire
3. **Viewport height is dynamic** - `window.innerHeight` changes when keyboard appears
4. **Direct height manipulation fails** - Setting `body.style.height` via JS gets overridden

### Telegram Mini App Specifics
- `--tg-viewport-stable-height` variable updates before `window.innerHeight`
- Safe area insets change when keyboard appears
- 1-second delay for keyboard animation is standard Telegram behavior
- WebApp clipboard API available for copying logs

### Solution Pattern
**Don't fight the browser, work with it:**
- Instead of blocking scroll → make layout scroll-independent
- Instead of fixed positioning → use absolute with min-height
- Instead of preventing events → accept them and design around them

## Testing & Validation

### Debug Process
1. User taps input field
2. Diagnostic logs show:
   - Initial state (viewport 844px)
   - Keyboard trigger (viewport changes to 508px)
   - RESIZE event
   - SCROLL events (336px → 0)
   - Stable state after 1s

3. User copies logs via debug button
4. Logs analyzed to identify scroll patterns

### Current Status
**Testing in progress** - Awaiting user feedback on final absolute positioning approach.

## Next Steps

1. **Verify Solution** - User to test keyboard behavior with absolute positioning
2. **Remove Unused Code** - If solution works, remove:
   - `useScrollLock.ts`
   - `useFixedBodyHeight.ts`
   - Debug buttons (or make permanent dev-only feature)

3. **Optimize** - Remove diagnostic logging overhead if not needed

4. **Document** - Update component documentation with layout architecture decisions

## Development Commands

```bash
# Development server
npm run dev

# Ngrok tunnel (already running)
ngrok http 3000 --log=stdout
```

## Timeline

- **Session Start:** ~10:21 UTC
- **Multiple iterations:** 10:21 - 13:00 UTC
- **Final approach implemented:** 14:02 UTC
- **Status:** Testing in progress
