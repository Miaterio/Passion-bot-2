'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { addDebugLog } from '../DebugOverlay/DebugOverlay';

interface BounceEffectProps {
    children: React.ReactNode;
    maxPullDistance?: number;
    resistance?: number;
}

/**
 * BounceEffect - Custom overscroll bounce effect for Telegram Mini Apps
 * 
 * Provides visual "rubber band" effect when user tries to scroll beyond content bounds.
 * Works with touch events to detect overscroll and applies CSS transform for smooth animation.
 */
export function BounceEffect({
    children,
    maxPullDistance = 120,
    resistance = 0.4
}: BounceEffectProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const touchStartY = useRef(0);
    const scrollStartY = useRef(0);
    const isPulling = useRef(false);
    const currentPullDistance = useRef(0); // Track actual pull distance
    const rafId = useRef<number>(0); // Store RAF ID in ref for access across handlers

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Removed `let rafId: number;` from here as it was shadowing the ref and causing inconsistencies.
        // All RAF operations will now use `rafId.current`.
        let moveCount = 0;

        const resetPull = () => {
            const logData = {
                isPulling: isPulling.current,
                currentPullDistance: currentPullDistance.current,
                rafPending: rafId.current !== 0
            };
            console.log('🔄 resetPull called', logData);
            addDebugLog('🔄 resetPull called', logData);

            // CRITICAL: Cancel any pending RAF first
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = 0;
                console.log('🚫 Canceled pending RAF');
                addDebugLog('🚫 Canceled pending RAF');
            }

            isPulling.current = false;
            currentPullDistance.current = 0;

            // Use flushSync to ensure state updates happen synchronously
            flushSync(() => {
                setIsAnimating(true);
            });

            // Set CSS variable directly for instant visual update
            if (contentRef.current) {
                requestAnimationFrame(() => {
                    contentRef.current?.style.setProperty('--pull-distance', '0');
                });
            }

            // Reset animating state after animation
            setTimeout(() => {
                setIsAnimating(false);
                console.log('✅ Animation complete, ready for next interaction');
                addDebugLog('✅ Animation complete');
            }, 300);
        };

        const handleTouchStart = (e: TouchEvent) => {
            moveCount = 0;
            touchStartY.current = e.touches[0].clientY;
            scrollStartY.current = container.scrollTop;
            isPulling.current = false;
            setIsAnimating(false);

            const logData = {
                touchY: e.touches[0].clientY,
                scrollTop: container.scrollTop,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight
            };
            console.log('👆 touchStart', logData);
            addDebugLog('👆 touchStart', logData);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const touchY = e.touches[0].clientY;
            const deltaY = touchY - touchStartY.current;

            // Check if content is scrollable
            const isScrollable = scrollHeight > clientHeight + 1; // +1 for rounding errors

            // Check if at top or bottom (only matters if content is scrollable)
            const isAtTop = scrollTop <= 1; // Small threshold for precision
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

            moveCount++;

            // Detect overscroll attempt first (before throttling) to prevent preventDefault issues
            const shouldBounce = !isScrollable || (isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0);

            if (shouldBounce) {
                // Prevent default scroll immediately
                e.preventDefault();

                // Log every 10th move to avoid spam
                if (moveCount % 10 === 0) {
                    const logData = {
                        moveCount,
                        scrollTop,
                        deltaY,
                        isScrollable,
                        isAtTop,
                        isAtBottom,
                        isPulling: isPulling.current,
                        currentPullDistance: currentPullDistance.current
                    };
                    console.log('👉 touchMove', logData);
                    addDebugLog('👉 touchMove', logData);
                }

                if (!isPulling.current) {
                    const logData = { deltaY, isScrollable, isAtTop, isAtBottom };
                    console.log('🎯 Started pulling', logData);
                    addDebugLog('🎯 Started pulling', logData);
                }

                isPulling.current = true;
                setIsAnimating(false);

                // Calculate pull distance with resistance
                const resistedDelta = deltaY * resistance;
                const clampedDelta = Math.max(
                    -maxPullDistance,
                    Math.min(maxPullDistance, resistedDelta)
                );

                // Update ref immediately
                currentPullDistance.current = clampedDelta;

                // Update CSS variable directly - NO React state, instant 60fps
                if (rafId.current) cancelAnimationFrame(rafId.current);
                rafId.current = requestAnimationFrame(() => {
                    if (contentRef.current) {
                        contentRef.current.style.setProperty('--pull-distance', `${clampedDelta}px`);
                    }
                });
            } else {
                // Normal scroll - reset if was pulling
                if (isPulling.current) {
                    console.log('⚠️ Normal scroll detected while pulling, resetting');
                    addDebugLog('⚠️ Normal scroll while pulling');
                    resetPull();
                }
            }
        };

        const handleTouchEnd = () => {
            const logData = {
                isPulling: isPulling.current,
                pullDistance: currentPullDistance.current,
                moveCount
            };
            console.log('👇 touchEnd', logData);
            addDebugLog('👇 touchEnd', logData);

            if (isPulling.current) {
                resetPull();
            }
        };

        // Add touch listeners
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [maxPullDistance, resistance]);

    return (
        <div
            ref={containerRef}
            style={{
                minHeight: '100%',
                height: 'auto',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                // Add padding to prevent content clipping during bounce
                paddingTop: `${maxPullDistance}px`,
                paddingBottom: `${maxPullDistance}px`,
                marginTop: `-${maxPullDistance}px`,
                marginBottom: `-${maxPullDistance}px`,
            }}
        >
            <div
                ref={contentRef}
                style={{
                    // CSS variable for pull distance - updated directly, no React re-render
                    ['--pull-distance' as string]: '0px',
                    // GPU acceleration with translate3d using CSS variable
                    transform: 'translate3d(0, var(--pull-distance), 0)',
                    // Remove contain to allow overflow
                    // CSS containment for rendering optimization
                    contain: 'layout style paint',
                    // Only use willChange during interaction to save memory
                    willChange: (isPulling.current || isAnimating) ? 'transform' : 'auto',
                    transition: isAnimating ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
}
