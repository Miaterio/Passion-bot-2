'use client';

import { useEffect, type ReactNode } from 'react';
import { miniApp, themeParams, viewport } from '@tma.js/sdk';
import { useSignal } from '@tma.js/sdk-react';

interface SafeAreaProviderProps {
    children: ReactNode;
}

/**
 * SafeAreaProvider - Manages Telegram theme and content safe area
 * 
 * This component:
 * 1. Applies Telegram theme colors to CSS variables
 * 2. Handles content safe area insets (critical for full-screen mode)
 * 3. Listens to theme and safe area changes
 * 
 * With proper error handling for non-Telegram environments.
 */
export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
    // Use useSignal to reactively track SDK values
    const theme = useSignal(themeParams.state);
    const vp = useSignal(viewport.state);
    // Track safe area insets reactively
    const safeAreaInsets = useSignal(viewport.safeAreaInsets);
    const contentSafeAreaInsets = useSignal(viewport.contentSafeAreaInsets);

    // Apply Telegram theme colors to CSS variables
    useEffect(() => {
        if (!theme) return;

        try {
            const root = document.documentElement;

            // Set all Telegram theme colors as CSS custom properties
            Object.entries(theme).forEach(([key, value]) => {
                if (value) {
                    // Convert snake_case to kebab-case for CSS
                    const cssVarName = `--tg-theme-${key.replace(/_/g, '-')}`;
                    root.style.setProperty(cssVarName, value);
                }
            });

            console.log('✅ Telegram theme applied:', theme);
        } catch (error) {
            console.warn('⚠️ Error applying theme:', error);
        }
    }, [theme]);

    // Handle content safe area insets (reactively via useSignal)
    useEffect(() => {
        if (!contentSafeAreaInsets) {
            console.warn('⚠️ Content safe area insets not available');
            return;
        }

        try {
            const root = document.documentElement;

            // Set content safe area CSS variables
            root.style.setProperty('--tg-content-safe-area-inset-top', `${contentSafeAreaInsets.top || 0}px`);
            root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentSafeAreaInsets.bottom || 0}px`);
            root.style.setProperty('--tg-content-safe-area-inset-left', `${contentSafeAreaInsets.left || 0}px`);
            root.style.setProperty('--tg-content-safe-area-inset-right', `${contentSafeAreaInsets.right || 0}px`);

            console.log('✅ Content safe area updated:', contentSafeAreaInsets);
        } catch (error) {
            console.warn('⚠️ Error updating content safe area:', error);
        }
    }, [contentSafeAreaInsets]);

    // Handle device safe area insets (reactively via useSignal)
    useEffect(() => {
        if (!safeAreaInsets) {
            console.warn('⚠️ Safe area insets not available');
            return;
        }

        try {
            const root = document.documentElement;

            // Set device safe area CSS variables
            root.style.setProperty('--tg-safe-area-inset-top', `${safeAreaInsets.top || 0}px`);
            root.style.setProperty('--tg-safe-area-inset-bottom', `${safeAreaInsets.bottom || 0}px`);
            root.style.setProperty('--tg-safe-area-inset-left', `${safeAreaInsets.left || 0}px`);
            root.style.setProperty('--tg-safe-area-inset-right', `${safeAreaInsets.right || 0}px`);

            console.log('✅ Safe area insets updated:', safeAreaInsets);
        } catch (error) {
            console.warn('⚠️ Error updating safe area insets:', error);
        }
    }, [safeAreaInsets]);

    // Handle viewport properties
    useEffect(() => {
        if (!vp) return;

        try {
            const root = document.documentElement;

            // Set viewport height variables
            root.style.setProperty('--tg-viewport-height', `${vp.height || 0}px`);
            root.style.setProperty('--tg-viewport-stable-height', `${vp.stableHeight || 0}px`);

            console.log('✅ Viewport info updated:', {
                height: vp.height,
                stableHeight: vp.stableHeight,
                isExpanded: vp.isExpanded,
            });
        } catch (error) {
            console.warn('⚠️ Error updating viewport info:', error);
        }
    }, [vp]);

    return <>{children}</>;
}
