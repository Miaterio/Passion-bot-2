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
  
  // Prefer contentSafeAreaInsets over safeAreaInsets
  const insets: SafeAreaInsets = contentInsets || fallbackInsets || {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  // Debug logging
  useEffect(() => {
    console.log('[SafeAreaProvider] contentSafeAreaInsets:', contentInsets);
    console.log('[SafeAreaProvider] safeAreaInsets (fallback):', fallbackInsets);
    console.log('[SafeAreaProvider] Using insets:', insets);
    console.log('[SafeAreaProvider] Calculated height:', `calc(100% - ${insets.top + insets.bottom}px)`);
  }, [contentInsets, fallbackInsets, insets]);

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
      }}
    >
      {/* Debug overlay - remove in production */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          background: contentInsets ? 'rgba(0, 128, 255, 0.9)' : 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '4px 8px',
          fontSize: '10px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {contentInsets ? 'Content' : 'Safe'} Area: T:{insets.top} B:{insets.bottom} L:{insets.left} R:{insets.right}
      </div>
      {/* Visual safe area indicators */}
      {insets.top > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: `${insets.top}px`,
            background: 'rgba(0, 255, 0, 0.2)',
            borderBottom: '2px solid lime',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        />
      )}
      {insets.bottom > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${insets.bottom}px`,
            background: 'rgba(0, 255, 0, 0.2)',
            borderTop: '2px solid lime',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
    </div>
  );
}
