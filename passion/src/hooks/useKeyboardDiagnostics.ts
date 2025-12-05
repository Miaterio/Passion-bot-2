import { useEffect } from 'react';

export function useKeyboardDiagnostics() {
    useEffect(() => {
        console.log('🔧 [DIAGNOSTICS] Enhanced keyboard diagnostics initialized');

        const logViewportInfo = (label: string = '') => {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            const container = document.querySelector('[data-chat-container]') as HTMLElement;

            const info = {
                label,
                timestamp: new Date().toISOString(),
                window: {
                    innerHeight: window.innerHeight,
                    innerWidth: window.innerWidth,
                    scrollY: window.scrollY,
                    scrollX: window.scrollX,
                },
                css: {
                    stableHeight: style.getPropertyValue('--tg-viewport-stable-height'),
                    viewportHeight: style.getPropertyValue('--tg-viewport-height'),
                    safeAreaTop: style.getPropertyValue('--tg-safe-area-inset-top'),
                    safeAreaBottom: style.getPropertyValue('--tg-safe-area-inset-bottom'),
                    contentSafeTop: style.getPropertyValue('--tg-content-safe-area-inset-top'),
                    contentSafeBottom: style.getPropertyValue('--tg-content-safe-area-inset-bottom'),
                },
                container: container ? {
                    height: container.offsetHeight,
                    top: container.offsetTop,
                    scrollTop: container.scrollTop,
                    computedHeight: window.getComputedStyle(container).height,
                    computedTop: window.getComputedStyle(container).top,
                    computedTransition: window.getComputedStyle(container).transition,
                } : null,
                body: {
                    height: document.body.offsetHeight,
                    scrollTop: document.body.scrollTop,
                    computedHeight: window.getComputedStyle(document.body).height,
                    computedPosition: window.getComputedStyle(document.body).position,
                }
            };

            console.log(`📊 [VIEWPORT${label ? ' - ' + label : ''}]`, JSON.stringify(info, null, 2));
        };

        // Initial log
        logViewportInfo('INIT');

        // Log on resize
        const handleResize = () => {
            console.log('📐 [RESIZE EVENT]');
            logViewportInfo('RESIZE');
        };

        // Log on scroll
        const handleScroll = (e: Event) => {
            console.log('📜 [SCROLL EVENT]', {
                target: (e.target as any)?.tagName || 'window',
                scrollY: window.scrollY,
                scrollX: window.scrollX
            });
            logViewportInfo('SCROLL');
        };

        // Log on focus (keyboard opening)
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                console.log('⌨️ [INPUT FOCUS]', {
                    tagName: target.tagName,
                    type: (target as HTMLInputElement).type,
                });
                setTimeout(() => logViewportInfo('FOCUS+50ms'), 50);
                setTimeout(() => logViewportInfo('FOCUS+200ms'), 200);
                setTimeout(() => logViewportInfo('FOCUS+500ms'), 500);
                setTimeout(() => logViewportInfo('FOCUS+1000ms'), 1000);
                setTimeout(() => logViewportInfo('FOCUS+1500ms'), 1500);
            }
        };

        const handleBlur = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                console.log('⌨️ [INPUT BLUR]');
                setTimeout(() => logViewportInfo('BLUR+50ms'), 50);
                setTimeout(() => logViewportInfo('BLUR+500ms'), 500);
            }
        };

        // Monitor CSS variable changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    console.log('🎨 [STYLE MUTATION]');
                    logViewportInfo('MUTATION');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        });

        // Listen to Telegram viewport events directly
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tgViewport = (window as any).Telegram.WebApp.viewportChanged;
            if (tgViewport) {
                tgViewport.isViewportChanged(() => {
                    console.log('📱 [TELEGRAM VIEWPORT CHANGED]');
                    logViewportInfo('TG_VIEWPORT');
                });
            }
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { capture: true });
        document.addEventListener('scroll', handleScroll, { capture: true });
        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('focus', handleFocus, true);
            document.removeEventListener('blur', handleBlur, true);
            observer.disconnect();
            console.log('🔧 [DIAGNOSTICS] Keyboard diagnostics cleaned up');
        };
    }, []);
}
