import { hapticFeedback } from '@tma.js/sdk';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for using Telegram Mini App haptic feedback
 * Safely handles cases where SDK is not initialized or haptics are not supported
 */
export function useHaptic() {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if haptic feedback is supported
        if (hapticFeedback.isSupported()) {
            setIsSupported(true);
        }
    }, []);

    /**
     * A style of impact occurred.
     * @param style 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
     */
    const impact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
        if (isSupported) {
            try {
                hapticFeedback.impactOccurred(style);
            } catch (e) {
                console.warn('Haptic impact failed:', e);
            }
        }
    }, [isSupported]);

    /**
     * A notification occurred.
     * @param type 'error' | 'success' | 'warning'
     */
    const notification = useCallback((type: 'error' | 'success' | 'warning') => {
        if (isSupported) {
            try {
                hapticFeedback.notificationOccurred(type);
            } catch (e) {
                console.warn('Haptic notification failed:', e);
            }
        }
    }, [isSupported]);

    /**
     * A selection change occurred.
     */
    const selection = useCallback(() => {
        if (isSupported) {
            try {
                hapticFeedback.selectionChanged();
            } catch (e) {
                console.warn('Haptic selection failed:', e);
            }
        }
    }, [isSupported]);

    return {
        impact,
        notification,
        selection,
        isSupported
    };
}
