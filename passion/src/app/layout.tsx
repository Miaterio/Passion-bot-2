import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';

import { Root } from '@/components/Root/Root';
import { I18nProvider } from '@/core/i18n/provider';

import '@telegram-apps/telegram-ui/dist/styles.css';
import 'normalize.css/normalize.css';
import './_assets/globals.css';

export const metadata: Metadata = {
  title: 'Your Application Title Goes Here',
  description: 'Your application description goes here',
};

// Critical viewport configuration for safe area support
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // CRITICAL: Allows app to extend into unsafe areas
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <I18nProvider>
          <Root>{children}</Root>
        </I18nProvider>
      </body>
    </html>
  );
}
