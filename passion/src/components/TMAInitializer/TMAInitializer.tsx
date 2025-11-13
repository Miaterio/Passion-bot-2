'use client';

import { useEffect, useState } from 'react';
import { miniApp, viewport, themeParams } from '@tma.js/sdk-react';

/**
 * TMAInitializer Component
 * 
 * Handles Telegram Mini App SDK initialization following the plan requirements:
 * - Mounts SDK components in correct order
 * - Implements timeout protection for viewport.mount()
 * - Binds CSS variables for viewport, miniApp, and themeParams
 * - Requests fullscreen/expanded mode if available
 * - Signals app ready to Telegram
 * 
 * CRITICAL BEHAVIORS:
 * - Components are mounted using their mount() methods
 * - viewport.mount() is asynchronous and requires timeout protection
 * - viewport.bindCssVars() - ONLY creates viewport dimension vars, NOT safe area vars
 * - Always calls miniApp.ready() even on failures
 */
export function TMAInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeTMA = async () => {
      try {
        // Check if running in Telegram environment
        if (!isTelegramEnvironment()) {
          console.warn('[TMAInitializer] Not running in Telegram Mini App');
          return;
        }

        console.log('[TMAInitializer] Starting initialization...');

        // 1. Mount miniApp
        try {
          if (miniApp.mount && typeof miniApp.mount === 'function') {
            miniApp.mount();
            console.log('[TMAInitializer] miniApp mounted');
          } else {
            console.warn('[TMAInitializer] miniApp.mount not available');
          }
        } catch (error) {
          console.error('[TMAInitializer] miniApp mount failed:', error);
        }

        // 2. Mount themeParams (synchronous despite name in v3.x)
        try {
          if (themeParams.mount && typeof themeParams.mount === 'function') {
            themeParams.mount();
            console.log('[TMAInitializer] themeParams mounted');
          } else {
            console.warn('[TMAInitializer] themeParams.mount not available');
          }
        } catch (error) {
          console.error('[TMAInitializer] themeParams mount failed:', error);
        }

        // 3. Mount viewport asynchronously with timeout protection (5 seconds)
        // This prevents hanging on macOS Telegram and other edge cases
        let viewportMounted = false;
        try {
          if (viewport.mount && typeof viewport.mount === 'function') {
            const viewportMountPromise = viewport.mount();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Viewport mount timeout')), 5000)
            );

            await Promise.race([viewportMountPromise, timeoutPromise]);
            viewportMounted = true;
            console.log('[TMAInitializer] viewport mounted successfully');
          } else {
            console.warn('[TMAInitializer] viewport.mount not available');
          }
        } catch (error) {
          console.warn('[TMAInitializer] viewport mount failed or timeout:', error);
          // Continue execution - SafeAreaProvider will handle fallback values
        }

        // 4. Bind CSS variables for viewport dimensions
        // IMPORTANT: This ONLY creates --tg-viewport-height, --tg-viewport-width, --tg-viewport-stable-height
        // It does NOT create safe area inset variables
        if (viewportMounted && viewport.isMounted()) {
          try {
            if (viewport.bindCssVars && typeof viewport.bindCssVars === 'function') {
              viewport.bindCssVars();
              console.log('[TMAInitializer] viewport CSS vars bound');
            }
          } catch (error) {
            console.error('[TMAInitializer] viewport.bindCssVars failed:', error);
          }
        }

        // 5. Bind CSS variables for miniApp
        try {
          if (miniApp.bindCssVars && typeof miniApp.bindCssVars === 'function') {
            miniApp.bindCssVars();
            console.log('[TMAInitializer] miniApp CSS vars bound');
          }
        } catch (error) {
          console.error('[TMAInitializer] miniApp.bindCssVars failed:', error);
        }

        // 6. Bind CSS variables for themeParams
        try {
          if (themeParams.bindCssVars && typeof themeParams.bindCssVars === 'function') {
            themeParams.bindCssVars();
            console.log('[TMAInitializer] themeParams CSS vars bound');
          }
        } catch (error) {
          console.error('[TMAInitializer] themeParams.bindCssVars failed:', error);
        }

        // 7. Request expanded viewport for better UX
        if (viewportMounted && viewport.isMounted()) {
          try {
            if (viewport.expand && typeof viewport.expand === 'function') {
              viewport.expand();
              console.log('[TMAInitializer] viewport expanded');
              console.log('[TMAInitializer] isExpanded:', viewport.isExpanded());
            }
          } catch (error) {
            console.warn('[TMAInitializer] viewport.expand failed:', error);
          }

          // Wait a bit for expand to complete
          await new Promise(resolve => setTimeout(resolve, 100));

          // 8. Request fullscreen mode
          try {
            if (viewport.requestFullscreen && typeof viewport.requestFullscreen === 'function') {
              await viewport.requestFullscreen();
              console.log('[TMAInitializer] fullscreen requested');
              console.log('[TMAInitializer] isFullscreen:', viewport.isFullscreen?.());
            }
          } catch (error) {
            console.warn('[TMAInitializer] fullscreen request failed:', error);
          }

          // Wait a bit for fullscreen to settle
          await new Promise(resolve => setTimeout(resolve, 100));

          // Log final viewport state
          console.log('[TMAInitializer] Final viewport state:', {
            isExpanded: viewport.isExpanded?.(),
            isFullscreen: viewport.isFullscreen?.(),
            contentSafeAreaInsets: viewport.contentSafeAreaInsets?.(),
            safeAreaInsets: viewport.safeAreaInsets?.(),
          });
        }

        setInitialized(true);
        console.log('[TMAInitializer] Initialization complete');

      } catch (error) {
        console.error('[TMAInitializer] Initialization failed:', error);
        setInitialized(true); // Set to true anyway to prevent infinite loading
      } finally {
        // CRITICAL: Signal to Telegram that app is ready
        // This must be called even if initialization fails to remove loading screen
        try {
          if (miniApp.ready && typeof miniApp.ready === 'function') {
            miniApp.ready();
            console.log('[TMAInitializer] App signaled ready to Telegram');
          }
        } catch (error) {
          console.error('[TMAInitializer] miniApp.ready failed:', error);
        }
      }
    };

    initializeTMA();
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Check if running in Telegram environment
 * Uses native Telegram WebApp detection (no external utility needed)
 */
function isTelegramEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}
