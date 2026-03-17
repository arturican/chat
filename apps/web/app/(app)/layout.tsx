import type { ReactNode } from 'react';

import { AppGate } from '../../src/features/auth/auth-gates';

interface ProtectedAppLayoutProps {
  children: ReactNode;
}

export default function ProtectedAppLayout({ children }: ProtectedAppLayoutProps) {
  return <AppGate>{children}</AppGate>;
}
