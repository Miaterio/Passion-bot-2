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

  // Small bottom padding for better spacing
  const telegramUIBottomPadding = 8;

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
        // Only bottom padding - top margin handled by CSS for first child
        paddingBottom: `${telegramUIBottomPadding}px`,
      }}
    >
      {children}
    </div>
  );
}
