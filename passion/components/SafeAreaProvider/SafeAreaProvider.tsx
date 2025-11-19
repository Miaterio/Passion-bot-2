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

    // Handle content safe area insets
    useEffect(() => {
        const updateContentSafeArea = () => {
            try {
                // Check if method exists and is callable
                if (typeof miniApp.contentSafeAreaInset !== 'function') {
                    console.warn('⚠️ contentSafeAreaInset is not a function');
                    return;
                }

                const contentSafeArea = miniApp.contentSafeAreaInset();

                if (!contentSafeArea) {
                    console.warn('⚠️ contentSafeAreaInset returned null/undefined');
                    return;
                }

                const root = document.documentElement;

                // Set content safe area CSS variables
                root.style.setProperty('--tg-content-safe-area-inset-top', `${contentSafeArea.top || 0}px`);
                root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentSafeArea.bottom || 0}px`);
                root.style.setProperty('--tg-content-safe-area-inset-left', `${contentSafeArea.left || 0}px`);
                root.style.setProperty('--tg-content-safe-area-inset-right', `${contentSafeArea.right || 0}px`);

                console.log('✅ Content safe area updated:', contentSafeArea);
            } catch (error) {
                console.warn('⚠️ Error updating content safe area:', error);
            }
        };

        // Update on mount
        updateContentSafeArea();

        // Listen for content safe area changes (if miniApp supports events)
        try {
            if (typeof miniApp.on === 'function') {
                const unsubscribe = miniApp.on('change:contentSafeAreaInset', () => {
                    console.log('📱 Content safe area changed');
                    updateContentSafeArea();
                });

                return () => {
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                };
            }
        } catch (error) {
            console.warn('⚠️ Could not subscribe to content safe area changes:', error);
        }
    }, []);

    // Handle safe area insets and viewport properties
    useEffect(() => {
        if (!vp) return;

        try {
            const root = document.documentElement;

            // Set device safe area CSS variables (use safeAreaInsets() method if available)
            if (typeof viewport.safeAreaInsets === 'function') {
                const safeArea = viewport.safeAreaInsets();
                if (safeArea) {
                    root.style.setProperty('--tg-safe-area-inset-top', `${safeArea.top || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-bottom', `${safeArea.bottom || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-left', `${safeArea.left || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-right', `${safeArea.right || 0}px`);
                }
            }

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

    // Handle viewport expansion state changes
    useEffect(() => {
        try {
            if (typeof viewport.on !== 'function') {
                return;
            }

            const handleExpansionChange = () => {
                try {
                    const currentVp = viewport.state();
                    if (currentVp.isExpanded) {
                        console.log('📱 Viewport expanded to full size');
                    }
                } catch (error) {
                    console.warn('⚠️ Error in expansion change handler:', error);
                }
            };

            // Listen for expansion state changes
            const unsubscribe = viewport.on('change:isExpanded', handleExpansionChange);

            return () => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            };
        } catch (error) {
            console.warn('⚠️ Could not subscribe to viewport expansion changes:', error);
        }
    }, []);

    return <>{children}</>;
}
