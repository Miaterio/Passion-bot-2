'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { init, miniApp, viewport, swipeBehavior } from '@tma.js/sdk';
import { SafeAreaProvider } from '@/components/SafeAreaProvider/SafeAreaProvider';
import { DebugConsole } from '@/components/DebugConsole/DebugConsole';

interface ProvidersProps {
    children: ReactNode;
}

/**
 * Providers - Main TMA SDK initialization wrapper
 * 
 * This component:
 * 1. Initializes @tma.js/sdk
 * 2. Expands viewport to full size
 * 3. Requests content safe area
 * 4. Provides SDK context to children
 * 5. Wraps with SafeAreaProvider and DebugConsole
 */
export function Providers({ children }: ProvidersProps) {
    const [sdkInitialized, setSDKInitialized] = useState(false);

    useEffect(() => {
        let sdkInitialized = false;

        try {
            // Initialize TMA SDK
            console.log('🚀 Initializing Telegram Mini App SDK...');
            init();
            sdkInitialized = true;
            console.log('✅ Telegram Mini App SDK initialized successfully');
        } catch (error) {
            // Expected error when running outside Telegram
            if (error instanceof Error && error.message.includes('Unable to retrieve launch parameters')) {
                console.warn('⚠️ Running outside Telegram environment - SDK not initialized');
            } else {
                console.error('❌ Failed to initialize TMA SDK:', error);
            }
        }

        // Only proceed with viewport/miniApp if SDK initialized
        if (sdkInitialized) {
            try {
                // Expand viewport to full size
                if (viewport.mount.isAvailable()) {
                    viewport.mount();
                    viewport.expand();
                    console.log('📱 Viewport expanded to full size');
                    
                    // Bind CSS variables for viewport dimensions (height, width, stable-height)
                    if (viewport.bindCssVars.isAvailable()) {
                        viewport.bindCssVars();
                        console.log('✅ CSS variables bound for viewport dimensions');
                    }
                    
                    // IMPORTANT: bindCssVars() does NOT create safe area variables!
                    // We need to manually bind contentSafeAreaInsets to CSS variables
                    // 
                    // According to official Telegram documentation:
                    // contentSafeAreaInsets SHOULD include:
                    // 1. Device-level safe areas (status bar, notch, home indicator)
                    // 2. Telegram UI elements (back button, menu buttons, etc.)
                    // 
                    // Expected values on iOS:
                    // - top: ~90px (44px status bar + 46px Telegram UI)
                    // - bottom: ~34px (home indicator)
                    // 
                    // If actual values differ, this indicates a bug in Telegram or SDK
                    const bindSafeAreaVars = () => {
                        try {
                            const insets = viewport.contentSafeAreaInsets();
                            if (insets) {
                                console.log('🔍 CONTENT SAFE AREA INSETS FROM SDK:', insets);
                                console.log('📊 Breakdown:', {
                                    top: `${insets.top}px (should include Telegram UI ~46px)`,
                                    bottom: `${insets.bottom}px`,
                                    left: `${insets.left}px`,
                                    right: `${insets.right}px`
                                });
                                
                                document.documentElement.style.setProperty('--tg-content-safe-area-inset-top', `${insets.top}px`);
                                document.documentElement.style.setProperty('--tg-content-safe-area-inset-bottom', `${insets.bottom}px`);
                                document.documentElement.style.setProperty('--tg-content-safe-area-inset-left', `${insets.left}px`);
                                document.documentElement.style.setProperty('--tg-content-safe-area-inset-right', `${insets.right}px`);
                                console.log('✅ Safe area CSS variables bound:', insets);
                            } else {
                                console.warn('⚠️ contentSafeAreaInsets returned null/undefined');
                            }
                        } catch (error) {
                            console.warn('⚠️ Could not bind safe area vars:', error);
                        }
                    };
                    
                    // Bind immediately
                    bindSafeAreaVars();
                    
                    // Subscribe to changes (when keyboard appears, orientation changes, etc.)
                    if (viewport.contentSafeAreaInsets.sub) {
                        viewport.contentSafeAreaInsets.sub(bindSafeAreaVars);
                        console.log('✅ Subscribed to safe area changes');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Could not expand viewport:', error);
            }

            try {
                // Request content safe area information
                if (miniApp.mount.isAvailable()) {
                    miniApp.mount();
                    console.log('✅ MiniApp mounted');
                    
                    // Note: Content safe area is automatically available when viewport is expanded
                    // in fullscreen mode with Bot API 8.0+. No explicit request needed in SDK v3.
                }
            } catch (error) {
                console.warn('⚠️ Could not mount miniApp:', error);
            }

            // Log safe area values after mounting
            setTimeout(() => {
                try {
                    const safeArea = viewport.contentSafeAreaInsets();
                    console.log('🔍 DIAGNOSTIC: Safe Area Insets (after mount)', {
                        contentSafeArea: safeArea,
                        viewport: {
                            height: viewport.height(),
                            isExpanded: viewport.isExpanded()
                        }
                    });
                    
                    if (safeArea.bottom === 0 && safeArea.top === 0) {
                        console.warn('⚠️ Safe area insets are all zero - check Bot API version (requires 8.0+)');
                    }
                } catch (error) {
                    console.warn('⚠️ Could not read safe area insets:', error);
                }
            }, 500);

            try {
                // Disable vertical swipes to prevent app from collapsing on scroll
                // Requires Bot API 7.7+
                // Must mount swipeBehavior before using it
                if (swipeBehavior.mount.isAvailable()) {
                    swipeBehavior.mount();
                    console.log('✅ SwipeBehavior mounted');

                    if (swipeBehavior.disableVertical.isAvailable()) {
                        swipeBehavior.disableVertical();
                        console.log('✅ Vertical swipes disabled - app won\'t collapse on scroll');
                    } else {
                        console.warn('⚠️ disableVertical not available (requires Bot API 7.7+)');
                    }
                } else {
                    console.warn('⚠️ SwipeBehavior not available');
                }
            } catch (error) {
                console.warn('⚠️ Could not disable vertical swipes:', error);
            }
        }

        setSDKInitialized(true);
    }, []);

    // Show loading indicator while SDK initializes
    if (!sdkInitialized) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--tg-theme-bg-color, #ffffff)',
                color: 'var(--tg-theme-text-color, #000000)'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <SafeAreaProvider>
            <DebugConsole />
            {children}
        </SafeAreaProvider>
    );
}
