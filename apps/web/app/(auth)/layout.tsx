import type { ReactNode } from 'react';

import { GuestGate } from '../../src/features/auth/auth-gates';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <GuestGate>{children}</GuestGate>;
}
