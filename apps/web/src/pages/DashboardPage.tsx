import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConstructionStore } from '@/stores/useConstructionStore';
import { useElectionStore } from '@/stores/useElectionStore';
import { useLevyStore } from '@/stores/useLevyStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useIwiStore } from '@/stores/useIwiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import {
  HardHat,
  CreditCard,
  Vote,
  Leaf,
  ArrowRight,
  FileText,
  Plus,
  FolderOpen,
  Clock,
} from 'lucide-react';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();

  const updates = useConstructionStore((s) => s.updates);
  const elections = useElectionStore((s) => s.elections);
  const payments = useLevyStore((s) => s.payments);
  const documents = useDocumentStore((s) => s.documents);
  const notices = useIwiStore((s) => s.notices);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Derived data (memoized, no allocating selectors)
  const latestUpdate = useMemo(() => updates[0] ?? null, [updates]);
  const openElection = useMemo(() => elections.find((e) => e.status === 'open') ?? null, [elections]);

  const myPayments = useMemo(() => {
    if (!currentUser) return [];
    if (isManagerOrAdmin) return payments;
    return payments.filter((p) => p.ownerId === currentUser.id);
  }, [payments, currentUser, isManagerOrAdmin]);

  const nextDue = useMemo(() => {
    const pending = myPayments.filter((p) => p.status === 'pending' || p.status === 'overdue');
    if (pending.length === 0) return null;
    return pending.reduce((a, b) => {
      const da = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
      const db = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
      return da <= db ? a : b;
    });
  }, [myPayments]);

  const unackNotices = useMemo(() => {
    if (!currentUser) return 0;
    return notices.filter(
      (n) => n.requiresAcknowledgement && !n.acknowledgedBy.includes(currentUser.id)
    ).length;
  }, [notices, currentUser]);

  // Recent activity feed (last 5 across all modules)
  const recentActivity = useMemo(() => {
    const items: { id: string; label: string; time: Date; route: string; type: string }[] = [];
    updates.slice(0, 3).forEach((u) =>
      items.push({ id: u.id, label: u.title, time: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt), route: '/construction', type: 'construction' })
    );
    documents.slice(0, 3).forEach((d) =>
      items.push({ id: d.id, label: d.title, time: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt), route: '/documents', type: 'document' })
    );
    notices.slice(0, 3).forEach((n) =>
      items.push({ id: n.id, label: n.title, time: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt), route: '/iwi', type: 'iwi' })
    );
    payments.slice(0, 2).forEach((p) =>
      items.push({ id: p.id, label: p.description, time: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt), route: '/levies', type: 'levy' })
    );
    items.sort((a, b) => b.time.getTime() - a.time.getTime());
    return items.slice(0, 5);
  }, [updates, documents, notices, payments]);

  const activityIcon: Record<string, React.ReactNode> = {
    construction: <HardHat size={14} className="text-primary" />,
    document: <FolderOpen size={14} className="text-accent" />,
    iwi: <Leaf size={14} className="text-[var(--cat-cultural)]" />,
    levy: <CreditCard size={14} className="text-[var(--status-paid)]" />,
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const hasAnyData = updates.length > 0 || elections.length > 0 || payments.length > 0 || notices.length > 0;

  return (
    <div>
      {/* Estate header */}
      <div
        className="border-b border-border bg-background px-6 py-7"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              {today.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1
              className="text-2xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {greeting},{' '}
              {currentUser?.fullName?.split(' ')[0] ?? 'welcome'}.
            </h1>
            {currentUser?.lotNumber && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Lot {currentUser.lotNumber} · Wiroa Station
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {isManagerOrAdmin ? (
              <>
                <Button size="sm" onClick={() => navigate('/construction')}>
                  <Plus size={14} className="mr-1.5" />
                  Post update
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/documents')}>
                  Upload document
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => navigate('/levies')}>
                  View my levies
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/documents')}>
                  Browse documents
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8 max-w-6xl">
        {!hasAnyData ? (
          <EmptyState
            icon={HardHat}
            heading="Welcome to Wiroa Station"
            description="Your estate overview will populate as updates, documents, and notices are added. Check back once your estate manager posts the first update."
            ctaLabel={isManagerOrAdmin ? 'Post first update' : undefined}
            onCta={isManagerOrAdmin ? () => navigate('/construction') : undefined}
            ctaVisible={isManagerOrAdmin}
          />
        ) : (
          <>
            {/* Status Cards */}
            <section>
              <h2
                className="text-xs uppercase tracking-widest text-muted-foreground mb-4"
              >
                Estate Status
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* Construction */}
                <button
                  onClick={() => navigate('/construction')}
                  className="text-left rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] group"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <HardHat size={16} className="text-primary" />
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Construction</p>
                  {latestUpdate ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{latestUpdate.phase}</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${latestUpdate.progressPercent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{latestUpdate.progressPercent}% complete</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No updates yet</p>
                  )}
                </button>

                {/* Levy */}
                <button
                  onClick={() => navigate('/levies')}
                  className="text-left rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] group"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--status-paid-bg)]">
                      <CreditCard size={16} className="text-[var(--status-paid)]" />
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next levy</p>
                  {nextDue ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(nextDue.amountNZD)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due {formatDate(nextDue.dueDate)}
                      </p>
                      <StatusBadge variant={nextDue.status} className="mt-2" />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No pending levies</p>
                  )}
                </button>

                {/* Election */}
                <button
                  onClick={() => navigate('/elections')}
                  className="text-left rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] group"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--status-upcoming-bg)]">
                      <Vote size={16} className="text-[var(--status-upcoming)]" />
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Advisory Board</p>
                  {openElection ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{openElection.title}</p>
                      <StatusBadge variant="open" label="Voting open" className="mt-2" />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No open elections</p>
                  )}
                </button>

                {/* Iwi */}
                <button
                  onClick={() => navigate('/iwi')}
                  className="text-left rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] group"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--status-paid-bg)]">
                      <Leaf size={16} className="text-[var(--cat-cultural)]" />
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Iwi Liaison</p>
                  {unackNotices > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">{unackNotices} unacknowledged</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notices.length} total notice{notices.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {notices.length > 0 ? `${notices.length} notice${notices.length !== 1 ? 's' : ''}` : 'No notices yet'}
                    </p>
                  )}
                </button>
              </div>
            </section>

            {/* Recent activity */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Recent Activity
              </h2>
              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardContent className="p-0">
                  {recentActivity.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        Your estate overview is ready. Activity across all sections will appear here once updates begin.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {recentActivity.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            onClick={() => navigate(item.route)}
                            className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                              {activityIcon[item.type] ?? <FileText size={14} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-foreground">{item.label}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={11} />
                              <span>{formatDate(item.time)}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
