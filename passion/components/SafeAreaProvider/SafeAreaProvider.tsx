'use client';

import { useEffect, type ReactNode } from 'react';
import { miniApp, themeParams, viewport } from '@tma.js/sdk';

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
    // Initialize MiniApp and Viewport
    useEffect(() => {
        try {
            miniApp.ready();
            console.log('✅ MiniApp ready called');
        } catch (error) {
            console.warn('⚠️ Error calling miniApp.ready():', error);
        }
        
        try {
            viewport.expand();
            console.log('✅ Viewport expanded');
        } catch (error) {
            console.warn('⚠️ Error expanding viewport:', error);
        }
    }, []);

    // Bind Telegram theme CSS variables using built-in method
    useEffect(() => {
        try {
            if (themeParams.bindCssVars.isAvailable()) {
                // bindCssVars automatically creates CSS variables like --tg-theme-bg-color
                // and keeps them updated when theme changes
                const unbind = themeParams.bindCssVars();
                console.log('✅ Telegram theme CSS variables bound');
                return unbind;
            }
        } catch (error) {
            console.warn('⚠️ Error binding theme CSS variables:', error);
        }
    }, []);

    // Bind Viewport CSS variables using built-in method with custom naming
    useEffect(() => {
        try {
            if (viewport.bindCssVars.isAvailable()) {
                // Use custom CSS variable naming to match existing code expectations
                // Default would be --tg-viewport-*, but we want --tg-* for compatibility
                const unbind = viewport.bindCssVars((key) => {
                    // Map viewport property keys to CSS variable names without 'viewport-' prefix
                    const nameMap: Record<string, string> = {
                        'height': '--tg-viewport-height',
                        'width': '--tg-viewport-width',
                        'stableHeight': '--tg-viewport-stable-height',
                        'contentSafeAreaInsetTop': '--tg-content-safe-area-inset-top',
                        'contentSafeAreaInsetBottom': '--tg-content-safe-area-inset-bottom',
                        'contentSafeAreaInsetLeft': '--tg-content-safe-area-inset-left',
                        'contentSafeAreaInsetRight': '--tg-content-safe-area-inset-right',
                        'safeAreaInsetTop': '--tg-safe-area-inset-top',
                        'safeAreaInsetBottom': '--tg-safe-area-inset-bottom',
                        'safeAreaInsetLeft': '--tg-safe-area-inset-left',
                        'safeAreaInsetRight': '--tg-safe-area-inset-right',
                    };
                    return nameMap[key] || `--tg-viewport-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                });
                
                // Log initial values for debugging
                console.log('✅ Viewport CSS variables bound:', {
                    height: viewport.height(),
                    stableHeight: viewport.stableHeight(),
                    isExpanded: viewport.isExpanded(),
                    safeAreaInsets: viewport.safeAreaInsets(),
                    contentSafeAreaInsets: viewport.contentSafeAreaInsets()
                });
                
                // Verify CSS variables are actually set in DOM
                setTimeout(() => {
                    const computedStyle = getComputedStyle(document.documentElement);
                    const safeTop = computedStyle.getPropertyValue('--tg-safe-area-inset-top');
                    const contentSafeTop = computedStyle.getPropertyValue('--tg-content-safe-area-inset-top');
                    const safeBottom = computedStyle.getPropertyValue('--tg-safe-area-inset-bottom');
                    const contentSafeBottom = computedStyle.getPropertyValue('--tg-content-safe-area-inset-bottom');
                    
                    console.log('🔍 SAFE AREA DIAGNOSTIC:', {
                        'Device Safe Area Top (--tg-safe-area-inset-top)': safeTop,
                        'Telegram UI Top (--tg-content-safe-area-inset-top)': contentSafeTop,
                        'Total Top Should Be': `${safeTop} + ${contentSafeTop} + 16px spacing`,
                        'Device Safe Area Bottom (--tg-safe-area-inset-bottom)': safeBottom,
                        'Telegram UI Bottom (--tg-content-safe-area-inset-bottom)': contentSafeBottom
                    });
                    
                    console.log('🔍 CSS Variables in DOM', {
                        '--tg-safe-area-inset-top': safeTop,
                        '--tg-content-safe-area-inset-top': contentSafeTop,
                        '--tg-content-safe-area-inset-bottom': contentSafeBottom,
                        '--tg-content-safe-area-inset-left': computedStyle.getPropertyValue('--tg-content-safe-area-inset-left'),
                        '--tg-content-safe-area-inset-right': computedStyle.getPropertyValue('--tg-content-safe-area-inset-right')
                    });
                }, 100);
                
                return unbind;
            }
        } catch (error) {
            console.warn('⚠️ Error binding viewport CSS variables:', error);
        }
    }, []);

    return <>{children}</>;
}
