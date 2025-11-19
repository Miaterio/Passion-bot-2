'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { init, miniApp, viewport } from '@tma.js/sdk';
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
                }
            } catch (error) {
                console.warn('⚠️ Could not expand viewport:', error);
            }

            try {
                // Request content safe area information
                if (miniApp.mount.isAvailable()) {
                    miniApp.mount();
                    console.log('✅ MiniApp mounted');
                }
            } catch (error) {
                console.warn('⚠️ Could not mount miniApp:', error);
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
