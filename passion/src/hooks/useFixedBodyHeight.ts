import { useEffect } from 'react';

export function useFixedBodyHeight() {
    useEffect(() => {
        // Запоминаем ИЗНАЧАЛЬНУЮ высоту viewport
        const initialHeight = window.innerHeight;

        console.log('🔒 [FIXED BODY] BEFORE:', {
            'window.innerHeight': window.innerHeight,
            'body.offsetHeight': document.body.offsetHeight,
            'body.computedHeight': window.getComputedStyle(document.body).height,
            'html.computedHeight': window.getComputedStyle(document.documentElement).height,
        });

        // Фиксируем body height в пикселях (не vh!)
        document.body.style.height = `${initialHeight}px`;
        document.body.style.minHeight = `${initialHeight}px`;
        document.body.style.maxHeight = `${initialHeight}px`;

        // Также для html
        document.documentElement.style.height = `${initialHeight}px`;
        document.documentElement.style.minHeight = `${initialHeight}px`;
        document.documentElement.style.maxHeight = `${initialHeight}px`;

        console.log('🔒 [FIXED BODY] AFTER:', {
            'Fixed to': initialHeight + 'px',
            'body.computedHeight': window.getComputedStyle(document.body).height,
            'html.computedHeight': window.getComputedStyle(document.documentElement).height,
        });

        // Проверяем каждые 500ms что высота не изменилась
        const checkInterval = setInterval(() => {
            const currentBodyHeight = window.getComputedStyle(document.body).height;
            const currentHtmlHeight = window.getComputedStyle(document.documentElement).height;

            if (currentBodyHeight !== `${initialHeight}px` || currentHtmlHeight !== `${initialHeight}px`) {
                console.warn('⚠️ [FIXED BODY] Height changed!', {
                    expected: initialHeight + 'px',
                    'body.current': currentBodyHeight,
                    'html.current': currentHtmlHeight,
                    'window.innerHeight': window.innerHeight,
                });

                // Пере-применяем фиксацию
                document.body.style.height = `${initialHeight}px`;
                document.documentElement.style.height = `${initialHeight}px`;
            }
        }, 500);

        return () => {
            clearInterval(checkInterval);
            console.log('🔓 [FIXED BODY] Cleanup');
        };
    }, []);
}
