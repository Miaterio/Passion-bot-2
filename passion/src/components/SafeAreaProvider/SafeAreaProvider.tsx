'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { viewport } from '@tma.js/sdk-react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaProviderProps {
  children: ReactNode;
}

/**
 * SafeAreaProvider - Strategy A: JavaScript Signals with Subscription
 * 
 * Applies safe area insets as padding to ensure content remains within visible boundaries.
 * Uses signals from @tma.js/sdk-react for reactive updates.
 * 
 * CRITICAL: viewport.bindCssVars() does NOT create safe area CSS variables automatically.
 * This component manually handles safe area insets via signal subscriptions.
 */
export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    // Check if viewport is mounted
    if (!viewport.isMounted()) {
      console.warn('[SafeAreaProvider] Viewport not mounted');
      return;
    }

    /**
     * Get safe area insets with fallback strategy
     * 1. Try contentSafeAreaInsets (Bot API 8.0+)
     * 2. Fallback to safeAreaInsets (older versions)
     * 3. Ultimate fallback to zero insets
     */
    const getSafeAreaInsets = (): SafeAreaInsets => {
      try {
        // Try Bot API 8.0+ method first
        const contentInsets = viewport.contentSafeAreaInsets();
        if (contentInsets) {
          return contentInsets as SafeAreaInsets;
        }
      } catch (error) {
        console.warn('[SafeAreaProvider] contentSafeAreaInsets unavailable:', error);
      }

      try {
        // Fallback to older API
        const safeInsets = viewport.safeAreaInsets();
        if (safeInsets) {
          return safeInsets as SafeAreaInsets;
        }
      } catch (error) {
        console.warn('[SafeAreaProvider] safeAreaInsets unavailable:', error);
      }

      // Ultimate fallback
      return { top: 0, bottom: 0, left: 0, right: 0 };
    };

    // Set initial insets
    const initialInsets = getSafeAreaInsets();
    setInsets(initialInsets);

    // Subscribe to changes using .sub() method (NOT .subscribe())
    // The subscription automatically handles orientation changes and fullscreen transitions
    let unsubscribe: (() => void) | undefined;

    try {
      if (viewport.contentSafeAreaInsets && typeof viewport.contentSafeAreaInsets.sub === 'function') {
        unsubscribe = viewport.contentSafeAreaInsets.sub((newInsets) => {
          if (newInsets) {
            setInsets(newInsets as SafeAreaInsets);
          }
        });
      } else if (viewport.safeAreaInsets && typeof viewport.safeAreaInsets.sub === 'function') {
        // Fallback to safeAreaInsets subscription
        unsubscribe = viewport.safeAreaInsets.sub((newInsets) => {
          if (newInsets) {
            setInsets(newInsets as SafeAreaInsets);
          }
        });
      }
    } catch (error) {
      console.error('[SafeAreaProvider] Failed to subscribe to insets:', error);
    }

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <div
      className="safe-area-container"
      style={{
        paddingTop: `${insets.top}px`,
        paddingBottom: `${insets.bottom}px`,
        paddingLeft: `${insets.left}px`,
        paddingRight: `${insets.right}px`,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
