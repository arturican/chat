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
        eyebrow="Opening"
        title="Restoring your PulseChat session."
        description="We are getting your account ready so your workspace opens in the right state."
      />
    );
  }

  if (session.status === 'error') {
    return (
      <AuthStateScreen
        eyebrow="Connection Error"
        title="PulseChat could not open your workspace."
        description={
          session.errorMessage ?? 'We could not restore your session just now. Please try again.'
        }
        actionLabel="Try again"
        onAction={session.retryBootstrap}
      />
    );
  }

  if (session.status === 'guest') {
    return (
      <AuthStateScreen
        eyebrow="Redirecting"
        title="Sign in to continue."
        description="Sending you to the login page so you can open your PulseChat workspace."
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
        eyebrow="Checking"
        title="Looking for your active session."
        description="If you are already signed in, we will take you straight back to your workspace."
      />
    );
  }

  if (session.status === 'error') {
    return (
      <AuthStateScreen
        eyebrow="Connection Error"
        title="PulseChat cannot sign you in right now."
        description={session.errorMessage ?? 'Please try again in a moment.'}
        actionLabel="Try again"
        onAction={session.retryBootstrap}
      />
    );
  }

  if (session.status === 'authenticated') {
    return (
      <AuthStateScreen
        eyebrow="Redirecting"
        title="You are already signed in."
        description="Opening your PulseChat workspace now."
      />
    );
  }

  return <>{children}</>;
}
