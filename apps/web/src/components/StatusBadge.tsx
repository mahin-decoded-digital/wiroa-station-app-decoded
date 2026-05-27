import { cn } from '@/lib/utils';

type StatusVariant =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'open'
  | 'upcoming'
  | 'closed'
  | 'consultation'
  | 'update'
  | 'meeting'
  | 'decision'
  | 'cultural'
  | 'estate-wide'
  | 'lot-specific'
  | 'legal'
  | 'planning'
  | 'minutes'
  | 'financial'
  | 'technical'
  | 'correspondence';

const styles: Record<StatusVariant, string> = {
  paid: 'bg-[var(--status-paid-bg)] text-[var(--status-paid)]',
  pending: 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]',
  overdue: 'bg-[var(--status-overdue-bg)] text-[var(--status-overdue)]',
  open: 'bg-[var(--status-open-bg)] text-[var(--status-open)]',
  upcoming: 'bg-[var(--status-upcoming-bg)] text-[var(--status-upcoming)]',
  closed: 'bg-[var(--status-closed-bg)] text-[var(--status-closed)]',
  consultation: 'bg-accent/10 text-accent',
  update: 'bg-muted text-muted-foreground',
  meeting: 'bg-primary/10 text-primary',
  decision: 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]',
  cultural: 'bg-[var(--status-paid-bg)] text-[var(--status-paid)]',
  'estate-wide': 'bg-primary/10 text-primary',
  'lot-specific': 'bg-accent/10 text-accent',
  legal: 'bg-primary/10 text-primary',
  planning: 'bg-accent/10 text-accent',
  minutes: 'bg-muted text-muted-foreground',
  financial: 'bg-[var(--status-paid-bg)] text-[var(--status-paid)]',
  technical: 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]',
  correspondence: 'bg-[var(--status-closed-bg)] text-[var(--status-closed)]',
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text = label ?? variant.replace('-', ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize',
        styles[variant] ?? 'bg-muted text-muted-foreground',
        className
      )}
    >
      {text}
    </span>
  );
}
