import {
  backButton,
  initData as initDataSDK,
  miniApp,
  viewport,
  themeParams,
  retrieveLaunchParams,
  init as initSDK,
  mockTelegramEnv,
} from '@tma.js/sdk-react';

/**
 * Initializes the application and configures its dependencies.
 * 
 * Updated to use @tma.js/sdk v3.x API:
 * - miniApp.mountSync() for synchronous miniApp mount
 * - themeParams.mount() for synchronous theme params mount (despite method name)
 * - viewport.mount() with timeout protection for async viewport mount
 * - Proper bindCssVars() calls for all components
 * - Always calls miniApp.ready() even on failures
 */
export async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void> {
  // Check if running in Telegram environment
  if (typeof window !== 'undefined') {
    const isTelegram = !!(window as any).Telegram?.WebApp;
    if (!isTelegram && !options.mockForMacOS) {
      console.warn('[Init] Not running in Telegram Mini App environment');
      // Continue anyway for development purposes
    }
  }

  // Initialize SDK
  initSDK();

  // Add Eruda if needed.
  options.eruda &&
    void import('eruda').then(({ default: eruda }) => {
      eruda.init();
      eruda.position({ x: window.innerWidth - 50, y: 0 });
    });

  // Telegram for macOS has known bugs with theme and safe area events
  if (options.mockForMacOS) {
    mockTelegramEnv();
  }

  // Mount all components used in the project.
  // 1. Mount backButton if available
  try {
    if (backButton.mount) {
      backButton.mount();
      console.log('[Init] backButton mounted');
    }
  } catch (error) {
    console.warn('[Init] backButton mount failed:', error);
  }

  // 2. Restore init data
  try {
    if (initDataSDK.restore) {
      initDataSDK.restore();
      console.log('[Init] initData restored');
    }
  } catch (error) {
    console.warn('[Init] initData restore failed:', error);
  }

  // 3. Mount miniApp
  try {
    if (miniApp.mount) {
      miniApp.mount();
      console.log('[Init] miniApp mounted');
      
      // Bind miniApp CSS variables
      if (miniApp.bindCssVars) {
        miniApp.bindCssVars();
        console.log('[Init] miniApp CSS vars bound');
      }
    }
  } catch (error) {
    console.error('[Init] miniApp mount failed:', error);
  }

  // 4. Mount themeParams
  try {
    if (themeParams.mount) {
      themeParams.mount();
      console.log('[Init] themeParams mounted');
      
      // Bind themeParams CSS variables
      if (themeParams.bindCssVars) {
        themeParams.bindCssVars();
        console.log('[Init] themeParams CSS vars bound');
      }
    }
  } catch (error) {
    console.error('[Init] themeParams mount failed:', error);
  }

  // 5. Mount viewport with timeout protection (5 seconds)
  // This prevents hanging on macOS Telegram and other edge cases
  try {
    if (viewport.mount) {
      const viewportMountPromise = viewport.mount();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Viewport mount timeout')), 5000)
      );

      await Promise.race([viewportMountPromise, timeoutPromise]);
      
      // Bind viewport CSS variables (only creates height/width vars, NOT safe area)
      if (viewport.bindCssVars) {
        viewport.bindCssVars();
        console.log('[Init] viewport CSS vars bound');
      }
      
      console.log('[Init] Viewport mounted successfully');
      
      // Request expanded viewport for better UX
      if (viewport.expand) {
        viewport.expand();
        console.log('[Init] viewport expanded');
      }
      
      // Optionally request fullscreen (based on UX requirements)
      // Uncomment if fullscreen mode is desired:
      if (viewport.requestFullscreen) {
        try {
          await viewport.requestFullscreen();
          console.log('[Init] fullscreen requested');
        } catch (error) {
          console.warn('[Init] Fullscreen request failed:', error);
        }
      }
    }
  } catch (error) {
    console.warn('[Init] Viewport mount failed or timeout:', error);
    // Continue execution - SafeAreaProvider will handle fallback values
  }

  // CRITICAL: Signal to Telegram that app is ready
  // This must be called even if initialization fails to remove loading screen
  try {
    if (miniApp.ready) {
      miniApp.ready();
      console.log('[Init] App signaled ready to Telegram');
    }
  } catch (error) {
    console.error('[Init] miniApp.ready failed:', error);
  }
}