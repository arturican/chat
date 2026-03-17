import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthSessionProvider } from '../src/features/auth/auth-session-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'PulseChat',
  description: 'Production-minded realtime messenger MVP with auth-first routing.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
