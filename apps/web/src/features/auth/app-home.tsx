'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getApiErrorMessage } from '../../shared/api/api-client';
import { useAuthSession } from './auth-session-provider';

export function AppHome() {
  const router = useRouter();
  const session = useAuthSession();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await session.logout();
      startTransition(() => {
        router.replace('/login');
      });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="app-screen">
      <div className="shell app-shell">
        <section className="hero app-hero">
          <span className="badge">Protected App Shell</span>
          <div className="app-hero-head">
            <div>
              <h1 className="title app-title">Phase 1 auth is now gating the real root route.</h1>
              <p className="subtitle app-subtitle">
                The refresh cookie restored this shell, the access token lives only in memory, and
                the next phase can now build chats on top of a stable identity layer.
              </p>
            </div>

            <button
              className="ghost-button"
              disabled={isLoggingOut}
              type="button"
              onClick={() => void handleLogout()}
            >
              {isLoggingOut ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </section>

        <section className="app-grid">
          <article className="card app-card">
            <h2>Current User</h2>
            <strong>{session.user?.username ?? 'session-user'}</strong>
            <p>{session.user?.email ?? 'No user loaded.'}</p>
            <div className="profile-pill">
              <span>Display name</span>
              <strong>{session.user?.displayName ?? 'Not set yet'}</strong>
            </div>
          </article>

          <article className="card app-card">
            <h2>Session Status</h2>
            <strong className="status">Authenticated</strong>
            <p>
              Protected routing now depends on refresh bootstrapping and a follow-up `GET /me`
              validation.
            </p>
            <div className="session-chip-row">
              <span className="session-chip">refresh cookie: active</span>
              <span className="session-chip">access token: in memory</span>
            </div>
          </article>

          <article className="card app-card empty-card">
            <h2>Next Phase</h2>
            <strong>No chats yet</strong>
            <p>
              This empty state is intentional: auth is complete, while chat list, members, and
              message history begin in the next implementation step.
            </p>
          </article>
        </section>

        {logoutError ? (
          <section className="card inline-alert" role="alert">
            <h2>Logout issue</h2>
            <p>{logoutError}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
