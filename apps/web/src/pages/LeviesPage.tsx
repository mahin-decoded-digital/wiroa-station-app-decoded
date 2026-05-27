import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLevyStore } from '@/stores/useLevyStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CreditCard, Plus, Trash } from 'lucide-react';
import type { LevyPayment } from '@/types';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 }).format(n);
}

export default function LeviesPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const payments = useLevyStore((s) => s.payments);
  const filterStatus = useLevyStore((s) => s.filterStatus);
  const addLevy = useLevyStore((s) => s.addLevy);
  const markPaid = useLevyStore((s) => s.markPaid);
  const removeLevy = useLevyStore((s) => s.removeLevy);
  const setFilterStatus = useLevyStore((s) => s.setFilterStatus);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  // Add levy dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [levyForm, setLevyForm] = useState({
    description: '',
    amountNZD: '',
    dueDate: '',
    lotNumber: '',
    status: 'pending' as LevyPayment['status'],
    ownerId: '',
  });
  const [levyErrors, setLevyErrors] = useState<Record<string, string>>({});

  // Mark paid dialog
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [receiptRef, setReceiptRef] = useState('');
  const [receiptError, setReceiptError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Scope: owners see only their own levies
  const scopedPayments = useMemo(() => {
    if (!currentUser) return [];
    if (isManagerOrAdmin) return payments;
    return payments.filter((p) => p.ownerId === currentUser.id);
  }, [payments, currentUser, isManagerOrAdmin]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return scopedPayments;
    return scopedPayments.filter((p) => p.status === filterStatus);
  }, [scopedPayments, filterStatus]);

  // Summary stats
  const totalDue = useMemo(
    () =>
      scopedPayments
        .filter((p) => p.status === 'pending' || p.status === 'overdue')
        .reduce((acc, p) => acc + p.amountNZD, 0),
    [scopedPayments]
  );

  const year = new Date().getFullYear();
  const totalPaidThisYear = useMemo(
    () =>
      scopedPayments
        .filter((p) => {
          if (p.status !== 'paid' || !p.paidDate) return false;
          const pd = p.paidDate instanceof Date ? p.paidDate : new Date(p.paidDate);
          return pd.getFullYear() === year;
        })
        .reduce((acc, p) => acc + p.amountNZD, 0),
    [scopedPayments, year]
  );

  const overdueCount = useMemo(
    () => scopedPayments.filter((p) => p.status === 'overdue').length,
    [scopedPayments]
  );

  const validateLevy = () => {
    const e: Record<string, string> = {};
    if (!levyForm.description.trim()) e.description = 'Description is required.';
    if (!levyForm.amountNZD || isNaN(parseFloat(levyForm.amountNZD))) e.amountNZD = 'Valid amount is required.';
    if (!levyForm.dueDate) e.dueDate = 'Due date is required.';
    if (!levyForm.lotNumber.trim()) e.lotNumber = 'Lot number is required.';
    if (isManagerOrAdmin && !levyForm.ownerId.trim()) e.ownerId = 'Owner ID is required.';
    return e;
  };

  const handleAddLevy = (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validateLevy();
    if (Object.keys(e).length > 0) { setLevyErrors(e); return; }
    addLevy({
      description: levyForm.description.trim(),
      amountNZD: parseFloat(levyForm.amountNZD),
      dueDate: new Date(levyForm.dueDate),
      lotNumber: levyForm.lotNumber.trim(),
      ownerId: isManagerOrAdmin ? levyForm.ownerId.trim() : (currentUser?.id ?? ''),
      paidDate: null,
      status: levyForm.status,
      receiptRef: null,
    });
    setAddDialogOpen(false);
    setLevyForm({ description: '', amountNZD: '', dueDate: '', lotNumber: '', status: 'pending', ownerId: '' });
    setLevyErrors({});
  };

  const handleMarkPaid = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!markPaidId) return;
    if (!receiptRef.trim()) { setReceiptError('Receipt reference is required.'); return; }
    markPaid(markPaidId, receiptRef.trim());
    toast.success('Payment marked as paid.');
    setMarkPaidId(null);
    setReceiptRef('');
    setReceiptError('');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeLevy(deleteId);
    toast.success('Levy record removed.');
    setDeleteId(null);
  };

  const statusFilters = ['all', 'pending', 'paid', 'overdue'] as const;

  return (
    <div>
      <PageHeader
        title="Levy Payments"
        description={
          isManagerOrAdmin
            ? `Estate-wide levy management. Total outstanding: ${formatCurrency(totalDue)}.`
            : `Your levy obligations for Lot ${currentUser?.lotNumber ?? '—'}.`
        }
        actions={
          isManagerOrAdmin ? (
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Add levy
            </Button>
          ) : null
        }
      />

      {/* Summary bar */}
      <div
        className="grid grid-cols-3 divide-x divide-border border-b border-border bg-background"
      >
        {[
          { label: 'Outstanding', value: formatCurrency(totalDue) },
          { label: `Paid ${year}`, value: formatCurrency(totalPaidThisYear) },
          { label: 'Overdue', value: String(overdueCount) },
        ].map((s) => (
          <div key={s.label} className="px-6 py-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p
              className="mt-1 text-xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-6 py-3">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={
              filterStatus === s
                ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground'
                : 'rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted capitalize'
            }
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-6 py-6">
        {scopedPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            heading="No levies on record"
            description="Estate levies for your lot will be listed here once your manager adds them. Each levy will show the amount, due date, and payment status."
            ctaLabel={isManagerOrAdmin ? 'Add first levy' : undefined}
            onCta={isManagerOrAdmin ? () => setAddDialogOpen(true) : undefined}
            ctaVisible={isManagerOrAdmin}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {isManagerOrAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Lot</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Receipt</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {isManagerOrAdmin && (
                        <td className="px-4 py-3 text-muted-foreground">{p.lotNumber}</td>
                      )}
                      <td className="px-4 py-3 font-medium text-foreground">{p.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                        {formatCurrency(p.amountNZD)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.dueDate)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={p.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.paidDate ? formatDate(p.paidDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {p.receiptRef ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {isManagerOrAdmin && p.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setMarkPaidId(p.id);
                                setReceiptRef('');
                                setReceiptError('');
                              }}
                            >
                              Mark paid
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Trash size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={isManagerOrAdmin ? 8 : 7}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No {filterStatus === 'all' ? '' : filterStatus} records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add levy dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Add levy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLevy} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="lv-desc">Description</Label>
              <Input
                id="lv-desc"
                value={levyForm.description}
                onChange={(e) => setLevyForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Q1 2025 Development Levy"
                className={levyErrors.description ? 'border-destructive' : ''}
              />
              {levyErrors.description && <p className="text-xs text-destructive">{levyErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lv-amount">Amount (NZD)</Label>
                <Input
                  id="lv-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={levyForm.amountNZD}
                  onChange={(e) => setLevyForm((p) => ({ ...p, amountNZD: e.target.value }))}
                  placeholder="e.g. 15000"
                  className={levyErrors.amountNZD ? 'border-destructive' : ''}
                />
                {levyErrors.amountNZD && <p className="text-xs text-destructive">{levyErrors.amountNZD}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lv-due">Due date</Label>
                <Input
                  id="lv-due"
                  type="date"
                  value={levyForm.dueDate}
                  onChange={(e) => setLevyForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className={levyErrors.dueDate ? 'border-destructive' : ''}
                />
                {levyErrors.dueDate && <p className="text-xs text-destructive">{levyErrors.dueDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lv-lot">Lot number</Label>
                <Input
                  id="lv-lot"
                  value={levyForm.lotNumber}
                  onChange={(e) => setLevyForm((p) => ({ ...p, lotNumber: e.target.value }))}
                  placeholder="e.g. LOT-12"
                  className={levyErrors.lotNumber ? 'border-destructive' : ''}
                />
                {levyErrors.lotNumber && <p className="text-xs text-destructive">{levyErrors.lotNumber}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lv-status">Status</Label>
                <Select
                  id="lv-status"
                  value={levyForm.status}
                  onChange={(e) => setLevyForm((p) => ({ ...p, status: e.target.value as LevyPayment['status'] }))}
                >
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lv-owner">Owner ID</Label>
              <Input
                id="lv-owner"
                value={levyForm.ownerId}
                onChange={(e) => setLevyForm((p) => ({ ...p, ownerId: e.target.value }))}
                placeholder="Owner's user ID"
                className={levyErrors.ownerId ? 'border-destructive' : ''}
              />
              {levyErrors.ownerId && <p className="text-xs text-destructive">{levyErrors.ownerId}</p>}
              <p className="text-xs text-muted-foreground">Enter the owner's user ID to associate this levy.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add levy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark paid dialog */}
      <Dialog open={markPaidId !== null} onOpenChange={(o) => { if (!o) setMarkPaidId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Confirm payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMarkPaid} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="receipt-ref">Receipt reference</Label>
              <Input
                id="receipt-ref"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="e.g. RCP-2025-0042"
                className={receiptError ? 'border-destructive' : ''}
              />
              {receiptError && <p className="text-xs text-destructive">{receiptError}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Confirm payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Remove this levy record?"
        description="This action cannot be undone."
        confirmLabel="Yes, remove"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
