'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { viewport, useSignal } from '@tma.js/sdk-react';

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
  // CRITICAL: Use contentSafeAreaInsets (Bot API 8.0+) for fullscreen mode
  // This accounts for Telegram UI elements like close button, header, etc.
  const contentInsets = useSignal(viewport.contentSafeAreaInsets);
  
  // Fallback for older Telegram versions
  const fallbackInsets = useSignal(viewport.safeAreaInsets);
  
  // Additional viewport state for diagnostics
  const isExpanded = useSignal(viewport.isExpanded);
  
  // Prefer contentSafeAreaInsets over safeAreaInsets
  // BUT: Use max values as fallback since contentSafeAreaInsets.bottom can be 0 on some Telegram versions
  const insets: SafeAreaInsets = {
    top: Math.max(
      contentInsets?.top ?? 0,
      fallbackInsets?.top ?? 0
    ),
    bottom: Math.max(
      contentInsets?.bottom ?? 0,
      fallbackInsets?.bottom ?? 0
    ),
    left: Math.max(
      contentInsets?.left ?? 0,
      fallbackInsets?.left ?? 0
    ),
    right: Math.max(
      contentInsets?.right ?? 0,
      fallbackInsets?.right ?? 0
    ),
  };

  // Debug logging
  useEffect(() => {
    console.log('[SafeAreaProvider] Full diagnostic:', {
      contentInsets,
      fallbackInsets,
      isExpanded,
      usingContentInsets: !!contentInsets,
      insetsAreSame: contentInsets && fallbackInsets && 
        contentInsets.top === fallbackInsets.top && 
        contentInsets.bottom === fallbackInsets.bottom,
    });
  }, [contentInsets, fallbackInsets, isExpanded, insets]);

  // Calculate additional padding for Telegram UI elements
  // WORKAROUND: contentSafeAreaInsets doesn't correctly account for Telegram's close button on iOS
  // GitHub issue: https://github.com/TelegramMessenger/Telegram-iOS/issues/1377
  // In fullscreen mode, Telegram adds a ~44-60px close button at the top, but contentSafeAreaInsets.bottom is often 0
  const telegramUITopPadding = contentInsets && contentInsets.bottom === 0 ? 20 : 0;
  const telegramUIBottomPadding = 8; // Small padding for better spacing

  return (
    <div
      className="safe-area-container"
      style={{
        // Use absolute positioning to control exact boundaries
        position: 'absolute',
        top: `${insets.top}px`,
        bottom: `${insets.bottom}px`,
        left: `${insets.left}px`,
        right: `${insets.right}px`,
        // Add padding inside the container as workaround for incorrect contentSafeAreaInsets on iOS
        paddingTop: `${telegramUITopPadding}px`,
        paddingBottom: `${telegramUIBottomPadding}px`,
      }}
    >
      {children}
    </div>
  );
}
