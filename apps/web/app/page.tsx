import { loadPublicEnv } from '../src/shared/config/public-env';

export default function HomePage() {
  const env = loadPublicEnv();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <span className="badge">PulseChat Bootstrap</span>
          <h1 className="title">Realtime messenger skeleton is up and breathing.</h1>
          <p className="subtitle">
            The monorepo now has a typed contracts package, a NestJS + Fastify API bootstrap, and a
            Next.js App Router shell ready for the next feature slices.
          </p>
        </section>

        <section className="grid">
          <article className="card">
            <h2>Frontend</h2>
            <strong>Next.js App Router shell</strong>
            <p>
              A minimal landing surface is in place so we can add auth routes, chat layout, loading
              states, and responsive app navigation without reworking the bootstrap.
            </p>
          </article>

          <article className="card">
            <h2>Backend</h2>
            <strong className="status">API health endpoint online</strong>
            <p>Base URL from env: {env.apiBaseUrl}</p>
          </article>

          <article className="card">
            <h2>Next focus</h2>
            <strong>Auth-ready structure</strong>
            <ul>
              <li>Route groups for auth and app shells</li>
              <li>Shared API client and env validation</li>
              <li>Typed integration with shared contracts</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
