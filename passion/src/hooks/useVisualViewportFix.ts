'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle iOS Visual Viewport offset when keyboard appears
 * 
 * iOS Safari doesn't resize the layout viewport when the keyboard opens.
 * Instead, it SLIDES the entire layout viewport UP, causing elements to appear
 * to animate/jump. This hook uses the VisualViewport API to detect this offset
 * and apply counter-transformation to fixed elements.
 */
export function useVisualViewportFix() {
    const offsetRef = useRef<number>(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const vv = window.visualViewport;
        if (!vv) {
            console.log('⚠️ VisualViewport API not available');
            return;
        }

        const handleViewportChange = () => {
            // offsetTop is how much iOS has slid the layout viewport up
            const offset = vv.offsetTop || 0;
            offsetRef.current = offset;

            // Set CSS variable for use in styles
            document.documentElement.style.setProperty('--visual-viewport-offset', `${offset}px`);

            // Apply counter-transformation to fixed elements to keep them in place
            const fixedElements = document.querySelectorAll('[data-fixed-during-keyboard]');
            fixedElements.forEach((el) => {
                if (el instanceof HTMLElement) {
                    // Counter the iOS slide by translating back down
                    el.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
                }
            });

            console.log('📱 [VISUAL VIEWPORT]', {
                height: vv.height,
                width: vv.width,
                offsetTop: offset,
                scale: vv.scale,
            });
        };

        // Listen to both resize and scroll events on visualViewport
        vv.addEventListener('resize', handleViewportChange);
        vv.addEventListener('scroll', handleViewportChange);

        // Initial call
        handleViewportChange();

        return () => {
            vv.removeEventListener('resize', handleViewportChange);
            vv.removeEventListener('scroll', handleViewportChange);

            // Cleanup CSS variable
            document.documentElement.style.removeProperty('--visual-viewport-offset');
        };
    }, []);

    return offsetRef;
}
