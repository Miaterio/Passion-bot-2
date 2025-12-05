import { useEffect } from 'react';

export function useScrollLock() {
    useEffect(() => {
        // Force scroll to top on load
        window.scrollTo(0, 0);

        const handleScroll = () => {
            window.scrollTo(0, 0);
        };

        const handleResize = () => {
            window.scrollTo(0, 0);
            requestAnimationFrame(() => window.scrollTo(0, 0));
        };

        // Aggressive scroll locking
        window.addEventListener('scroll', handleScroll, { passive: false });
        document.addEventListener('scroll', handleScroll, { passive: false });

        // Also lock on visual viewport resize (keyboard open)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleScroll);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);
}
