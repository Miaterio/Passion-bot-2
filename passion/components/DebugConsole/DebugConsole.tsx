'use client';

import { useEffect } from 'react';

/**
 * DebugConsole - Loads Eruda mobile debugging console
 * 
 * Eruda provides a mobile-friendly DevTools console for debugging
 * Telegram Mini Apps on actual devices.
 * 
 * Loads when:
 * - NODE_ENV is 'development', OR
 * - URL has ?debug=true query parameter
 */
export function DebugConsole() {
    useEffect(() => {
        // Check if we should load debug console
        const isDevelopment = process.env.NODE_ENV === 'development';
        const hasDebugParam = typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).has('debug');

        if (!isDevelopment && !hasDebugParam) {
            return;
        }

        // Load Eruda dynamically
        const loadEruda = async () => {
            try {
                const eruda = await import('eruda');
                eruda.default.init();
                console.log('✅ Eruda debug console loaded');
            } catch (error) {
                console.error('❌ Failed to load Eruda:', error);
            }
        };

        loadEruda();
    }, []);

    return null; // This component doesn't render anything
}
