'use client';

import type { FormEvent } from 'react';
import { startTransition, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getApiErrorMessage } from '../../shared/api/api-client';
import { useAuthSession } from './auth-session-provider';

type AuthMode = 'login' | 'register';

interface AuthFormCardProps {
  mode: AuthMode;
}

interface AuthFormValues {
  email: string;
  password: string;
  username: string;
}

const initialFormValues: AuthFormValues = {
  email: '',
  password: '',
  username: '',
};

const contentByMode: Record<
  AuthMode,
  {
    badge: string;
    title: string;
    subtitle: string;
    submitLabel: string;
    alternateLabel: string;
    alternateHref: string;
    alternateText: string;
  }
> = {
  login: {
    badge: 'Welcome Back',
    title: 'Sign in and pick up your conversations.',
    subtitle: 'Jump back into PulseChat and continue where you left off.',
    submitLabel: 'Log in',
    alternateLabel: 'Need an account?',
    alternateHref: '/register',
    alternateText: 'Create one',
  },
  register: {
    badge: 'Join PulseChat',
    title: 'Create your account and start chatting.',
    subtitle: 'Set up your profile once and you will be ready to open conversations right away.',
    submitLabel: 'Create account',
    alternateLabel: 'Already registered?',
    alternateHref: '/login',
    alternateText: 'Sign in',
  },
};

export function AuthFormCard({ mode }: AuthFormCardProps) {
  const router = useRouter();
  const session = useAuthSession();
  const [formValues, setFormValues] = useState<AuthFormValues>(initialFormValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = contentByMode[mode];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await (mode === 'login'
        ? session.login({
            email: formValues.email,
            password: formValues.password,
          })
        : session.register({
            email: formValues.email,
            password: formValues.password,
            username: formValues.username,
          }));

      startTransition(() => {
        router.replace('/');
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="badge">{content.badge}</span>
          <h1 className="title auth-title">{content.title}</h1>
          <p className="subtitle auth-subtitle">{content.subtitle}</p>

          <div className="auth-stat-grid">
            <article className="auth-stat-card">
              <span className="auth-stat-label">Private by default</span>
              <strong>Your account, your space</strong>
              <p>
                Keep your profile ready, move between devices easily, and come back without
                friction.
              </p>
            </article>
            <article className="auth-stat-card">
              <span className="auth-stat-label">Built for momentum</span>
              <strong>Fast to open, easy to continue</strong>
              <p>
                Sign in once, return later, and keep moving through your conversations without extra
                setup.
              </p>
            </article>
          </div>
        </section>

        <section className="auth-panel">
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                className="input"
                name="email"
                placeholder="you@pulsechat.dev"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            {mode === 'register' ? (
              <label className="field">
                <span>Username</span>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  className="input"
                  name="username"
                  placeholder="pulse_builder"
                  type="text"
                  value={formValues.username}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      username: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <label className="field">
              <span>Password</span>
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="input"
                name="password"
                placeholder="At least 8 characters"
                type="password"
                value={formValues.password}
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    password: event.target.value,
                  }))
                }
              />
            </label>

            {submitError ? (
              <p className="feedback feedback-error" role="alert">
                {submitError}
              </p>
            ) : (
              <p className="feedback feedback-neutral">
                Use the details for your PulseChat account to continue.
              </p>
            )}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Working...' : content.submitLabel}
            </button>
          </form>

          <footer className="auth-footer">
            <span>{content.alternateLabel}</span>
            <Link href={content.alternateHref}>{content.alternateText}</Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
