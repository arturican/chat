export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Learning Chat</p>
        <h1>Workspace is ready</h1>
        <p>
          We will build the chat here step by step: auth over HTTP, message history over HTTP, and
          realtime updates over WebSocket.
        </p>
        <ul>
          <li>
            Frontend: Next.js in <code>apps/web</code>
          </li>
          <li>
            Backend: NestJS + Fastify in <code>apps/api</code>
          </li>
          <li>Next step: add PostgreSQL schema</li>
        </ul>
      </section>
    </main>
  );
}
