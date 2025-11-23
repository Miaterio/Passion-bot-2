'use client';

import { SDKProvider } from '@tma.js/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { type PropsWithChildren } from 'react';

import { SafeAreaProvider } from '@/components/SafeAreaProvider/SafeAreaProvider';

export function Root({ children }: PropsWithChildren) {
    return (
        <SDKProvider options={{ acceptCustomStyles: true, cssVars: true }}>
            <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
                <SafeAreaProvider>
                    {children}
                </SafeAreaProvider>
            </TonConnectUIProvider>
        </SDKProvider>
    );
}
