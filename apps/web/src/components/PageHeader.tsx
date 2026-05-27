import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border bg-background px-6 py-6 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div>
        <h1
          className="text-2xl font-semibold text-foreground tracking-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
