import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaVisible?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  ctaLabel,
  onCta,
  ctaVisible = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-20 px-6',
        className
      )}
    >
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border"
        style={{ background: 'var(--surface-parchment)' }}
      >
        <Icon size={22} className="text-muted-foreground" />
      </div>
      <h3
        className="mb-2 text-lg font-medium text-foreground"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {heading}
      </h3>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {ctaLabel && onCta && ctaVisible && (
        <Button onClick={onCta} className="mt-6" size="sm">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
