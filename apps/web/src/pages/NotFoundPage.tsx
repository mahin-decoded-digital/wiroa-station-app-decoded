import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface-parchment)' }}
    >
      <div className="text-center max-w-md">
        <p
          className="text-8xl font-semibold text-muted-foreground/30 select-none"
          style={{ fontFamily: 'var(--font-serif)' }}
          aria-hidden="true"
        >
          404
        </p>
        <h1
          className="mt-4 text-2xl font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          This page does not exist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The address you followed does not correspond to a section of the platform. It may have moved, or you may have followed an outdated link.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
