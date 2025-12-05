import { useState, useEffect, useRef, useMemo } from 'react';

interface KeyboardStateOptions {
    /** Input ref to monitor for focus/blur events */
    inputRef: React.RefObject<HTMLInputElement | null>;
    /** Threshold percentage for detecting keyboard (default: 0.7 = 30% reduction) */
    heightThreshold?: number;
}

/**
 * Hook to track keyboard open/close state in Telegram Mini App
 * 
 * Detects keyboard state by monitoring:
 * 1. Input focus/blur events
 * 2. Telegram viewport height changes
 * 
 * Returns true when keyboard is likely open (input focused + viewport height reduced > 30%)
 */
export function useKeyboardState({ inputRef, heightThreshold = 0.7 }: KeyboardStateOptions) {
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [viewportHeight, setViewportHeight] = useState<number>(0);
    const initialHeightRef = useRef<number>(0);
    const initialStableHeightRef = useRef<number>(0);

    // Initialize viewport height
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initialHeight = window.innerHeight;
            initialHeightRef.current = initialHeight;
            setViewportHeight(initialHeight);
        }
    }, []);

    // Set stable viewport height CSS var once on mount (for legacy compatibility only)
    // ВАЖНО: НЕ переопределяем --tg-viewport-stable-height - пусть Telegram SDK управляет им
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const tg = window.Telegram?.WebApp;
            if (tg && tg.viewportStableHeight) {
                // Store the initial stable height for reference
                initialStableHeightRef.current = tg.viewportStableHeight;
                // Set only our custom variable for legacy code that might use it
                document.documentElement.style.setProperty('--app-stable-viewport-height', `${tg.viewportStableHeight}px`);
                console.log('🔒 Set app stable viewport height:', tg.viewportStableHeight);
            } else {
                // Fallback
                const fallbackHeight = initialHeightRef.current || window.innerHeight;
                initialStableHeightRef.current = fallbackHeight;
                document.documentElement.style.setProperty('--app-stable-viewport-height', `${fallbackHeight}px`);
                console.log('🔒 Set fallback app stable viewport height:', fallbackHeight);
            }
        }
    }, []);

    // REMOVED: Continuous override was blocking Telegram SDK from updating CSS variables
    // The SDK's bindCssVars() in SafeAreaProvider handles --tg-viewport-* variables correctly

    useEffect(() => {
        const inputElement = inputRef.current;
        if (!inputElement) return;

        // Track input focus state
        const handleFocus = () => {
            setIsInputFocused(true);
        };

        const handleBlur = () => {
            setIsInputFocused(false);
        };

        inputElement.addEventListener('focus', handleFocus);
        inputElement.addEventListener('blur', handleBlur);

        // Listen to Telegram viewport changes
        const tg = window.Telegram?.WebApp;
        if (tg) {
            const handleViewportChange = (event?: any) => {
                // Use Telegram's viewport height from the event if available
                // Note: On iOS, window.innerHeight doesn't change, but Telegram reports the actual viewport
                const newHeight = event?.height || tg.viewportHeight || window.innerHeight;
                console.log('📊 [VIEWPORT CHANGE EVENT]', {
                    eventHeight: event?.height,
                    sdkHeight: tg.viewportHeight,
                    windowHeight: window.innerHeight,
                    using: newHeight
                });
                setViewportHeight(newHeight);
            };

            // Note: Using 'viewportChanged' event from Telegram SDK
            tg.onEvent('viewportChanged', handleViewportChange);

            return () => {
                tg.offEvent('viewportChanged', handleViewportChange);
                inputElement.removeEventListener('focus', handleFocus);
                inputElement.removeEventListener('blur', handleBlur);
            };
        } else {
            // Fallback to window resize for non-Telegram environments
            const handleResize = () => {
                setViewportHeight(window.innerHeight);
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                inputElement.removeEventListener('focus', handleFocus);
                inputElement.removeEventListener('blur', handleBlur);
            };
        }
    }, [inputRef]);

    // Calculate keyboard state
    const isKeyboardOpen = useMemo(() => {
        if (!isInputFocused) return false;
        if (initialHeightRef.current === 0) return false;

        // Keyboard is likely open if viewport height reduced by more than threshold
        const heightRatio = viewportHeight / initialHeightRef.current;
        return heightRatio < heightThreshold;
    }, [isInputFocused, viewportHeight, heightThreshold]);

    // Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('⌨️ [KEYBOARD STATE]', {
                isKeyboardOpen,
                isInputFocused,
                viewportHeight,
                initialHeight: initialHeightRef.current,
                heightRatio: initialHeightRef.current > 0 ? (viewportHeight / initialHeightRef.current).toFixed(2) : 'N/A'
            });
        }
    }, [isKeyboardOpen, isInputFocused, viewportHeight]);

    return isKeyboardOpen;
}
