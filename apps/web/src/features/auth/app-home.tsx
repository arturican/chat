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
          <span className="badge">PulseChat</span>
          <div className="app-hero-head">
            <div>
              <h1 className="title app-title">Your account is ready. Conversations are next.</h1>
              <p className="subtitle app-subtitle">
                We have your profile in place, so the home screen is ready to grow into your full
                chat workspace.
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
            <h2>Current Profile</h2>
            <strong>{session.user?.username ?? 'session-user'}</strong>
            <p>{session.user?.email ?? 'No user loaded.'}</p>
            <div className="profile-pill">
              <span>Display name</span>
              <strong>{session.user?.displayName ?? 'Not set yet'}</strong>
            </div>
          </article>

          <article className="card app-card">
            <h2>Account Status</h2>
            <strong className="status">Ready</strong>
            <p>
              Your account is active and prepared for direct messages, group spaces, and history.
            </p>
            <div className="session-chip-row">
              <span className="session-chip">Signed in</span>
              <span className="session-chip">Profile loaded</span>
            </div>
          </article>

          <article className="card app-card empty-card">
            <h2>Coming Up</h2>
            <strong>No conversations yet</strong>
            <p>
              The next update fills this space with your chat list, open conversations, and message
              history.
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
