'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthSession } from './auth-session-provider';

interface AuthGateProps {
  children: ReactNode;
}

interface AuthStateScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function AuthStateScreen({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: AuthStateScreenProps) {
  return (
    <main className="state-screen">
      <section className="state-panel">
        <span className="badge">{eyebrow}</span>
        <h1 className="state-title">{title}</h1>
        <p className="state-copy">{description}</p>
        {actionLabel && onAction ? (
          <button className="primary-button" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </section>
    </main>
  );
}

export function AppGate({ children }: AuthGateProps) {
  const router = useRouter();
  const session = useAuthSession();

  useEffect(() => {
    if (session.status === 'guest') {
      router.replace('/login');
    }
  }, [router, session.status]);

  if (session.status === 'bootstrapping') {
    return (
      <AuthStateScreen
        eyebrow="Session Sync"
        title="Restoring your PulseChat session."
        description="We are checking the refresh cookie and pulling your current profile before the app shell opens."
      />
    );
  }

  if (session.status === 'error') {
    return (
      <AuthStateScreen
        eyebrow="Connection Error"
        title="PulseChat could not restore the protected shell."
        description={
          session.errorMessage ??
          'The auth session could not be restored. Retry once the API is reachable again.'
        }
        actionLabel="Retry session check"
        onAction={session.retryBootstrap}
      />
    );
  }

  if (session.status === 'guest') {
    return (
      <AuthStateScreen
        eyebrow="Redirecting"
        title="Protected routes need an active session."
        description="Sending you to the login page so we can restore access cleanly."
      />
    );
  }

  return <>{children}</>;
}

export function GuestGate({ children }: AuthGateProps) {
  const router = useRouter();
  const session = useAuthSession();

  useEffect(() => {
    if (session.status === 'authenticated') {
      router.replace('/');
    }
  }, [router, session.status]);

  if (session.status === 'bootstrapping') {
    return (
      <AuthStateScreen
        eyebrow="Session Check"
        title="Checking whether you already have access."
        description="If the refresh cookie is still valid, we will skip the form and reopen your app shell automatically."
      />
    );
  }

  if (session.status === 'error') {
    return (
      <AuthStateScreen
        eyebrow="Auth Unavailable"
        title="PulseChat cannot reach the auth API right now."
        description={
          session.errorMessage ??
          'Retry once the API is online again so login and refresh can continue normally.'
        }
        actionLabel="Retry auth check"
        onAction={session.retryBootstrap}
      />
    );
  }

  if (session.status === 'authenticated') {
    return (
      <AuthStateScreen
        eyebrow="Redirecting"
        title="Your session is already active."
        description="Reopening the protected shell instead of showing auth forms again."
      />
    );
  }

  return <>{children}</>;
}
