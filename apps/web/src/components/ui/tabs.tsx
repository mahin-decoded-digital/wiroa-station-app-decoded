import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  activeValue: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn('w-full', className)} data-value={value} data-on-change={onValueChange}>
      {children}
    </div>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground gap-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, activeValue, onValueChange, children, className }: TabsTriggerProps) {
  const isActive = value === activeValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium',
        'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/60 hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeValue, children, className }: TabsContentProps) {
  if (value !== activeValue) return null;
  return <div className={cn('mt-4', className)}>{children}</div>;
}
