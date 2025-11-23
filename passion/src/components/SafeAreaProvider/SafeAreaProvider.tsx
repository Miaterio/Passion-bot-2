'use client';

import { useMiniApp, useViewport } from '@tma.js/sdk-react';
import { type PropsWithChildren, useEffect } from 'react';

export function SafeAreaProvider({ children }: PropsWithChildren) {
    const miniApp = useMiniApp();
    const viewport = useViewport();

    useEffect(() => {
        if (miniApp) {
            miniApp.ready();
        }
        if (viewport) {
            viewport.expand();
        }
    }, [miniApp, viewport]);

    return (
        <>
            {children}
        </>
    );
}
