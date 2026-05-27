import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConstructionStore } from '@/stores/useConstructionStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { HardHat, Pencil, Trash, Plus } from 'lucide-react';
import type { ConstructionUpdate } from '@/types';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

type UpdateFormData = {
  title: string;
  phase: string;
  scope: 'estate-wide' | 'lot-specific';
  lotNumber: string;
  body: string;
  progressPercent: string;
};

const EMPTY_FORM: UpdateFormData = {
  title: '',
  phase: '',
  scope: 'estate-wide',
  lotNumber: '',
  body: '',
  progressPercent: '0',
};

export default function ConstructionPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const updates = useConstructionStore((s) => s.updates);
  const filterScope = useConstructionStore((s) => s.filterScope);
  const filterPhase = useConstructionStore((s) => s.filterPhase);
  const addUpdate = useConstructionStore((s) => s.addUpdate);
  const editUpdate = useConstructionStore((s) => s.editUpdate);
  const removeUpdate = useConstructionStore((s) => s.removeUpdate);
  const setFilterScope = useConstructionStore((s) => s.setFilterScope);
  const setFilterPhase = useConstructionStore((s) => s.setFilterPhase);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionUpdate | null>(null);
  const [formData, setFormData] = useState<UpdateFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<UpdateFormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allPhases = useMemo(() => {
    const phases = updates.map((u) => u.phase).filter(Boolean);
    return Array.from(new Set(phases));
  }, [updates]);

  const filtered = useMemo(() => {
    return updates.filter((u) => {
      if (filterScope !== 'all' && u.scope !== filterScope) return false;
      if (filterPhase && u.phase !== filterPhase) return false;
      return true;
    });
  }, [updates, filterScope, filterPhase]);

  const estateWide = useMemo(() => updates.filter((u) => u.scope === 'estate-wide'), [updates]);
  const overallProgress = useMemo(() => {
    if (estateWide.length === 0) return 0;
    const sum = estateWide.reduce((acc, u) => acc + u.progressPercent, 0);
    return Math.round(sum / estateWide.length);
  }, [estateWide]);

  const latestPhase = useMemo(() => estateWide[0]?.phase ?? null, [estateWide]);

  const openCreate = () => {
    setEditTarget(null);
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (u: ConstructionUpdate) => {
    setEditTarget(u);
    setFormData({
      title: u.title,
      phase: u.phase,
      scope: u.scope,
      lotNumber: u.lotNumber ?? '',
      body: u.body,
      progressPercent: String(u.progressPercent),
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const e: Partial<UpdateFormData> = {};
    if (!formData.title.trim()) e.title = 'Title is required.';
    if (!formData.phase.trim()) e.phase = 'Phase is required.';
    if (!formData.body.trim()) e.body = 'Description is required.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!validateForm()) return;
    if (!currentUser) return;
    const percent = Math.min(100, Math.max(0, parseInt(formData.progressPercent) || 0));
    const payload = {
      title: formData.title.trim(),
      phase: formData.phase.trim(),
      scope: formData.scope,
      lotNumber: formData.scope === 'lot-specific' ? formData.lotNumber.trim() || null : null,
      body: formData.body.trim(),
      progressPercent: percent,
      postedBy: currentUser.fullName,
      attachmentUrls: [],
    };
    if (editTarget) {
      editUpdate(editTarget.id, payload);
      toast.success('Update saved.');
    } else {
      addUpdate(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeUpdate(deleteId);
    toast.success('Update removed.');
    setDeleteId(null);
  };

  return (
    <div>
      {/* Banner image */}
      <div className="relative h-36 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/27434716/pexels-photo-27434716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Estate construction in progress"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, hsl(217 50% 10% / 0.55) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 flex items-end px-6 pb-4">
          <p
            className="text-lg font-semibold text-primary-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Construction Progress
          </p>
        </div>
      </div>

      <PageHeader
        title="Construction"
        description="Track development progress across the estate and individual lots."
        actions={
          isManagerOrAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1.5" />
              Post update
            </Button>
          ) : null
        }
      />

      {/* Progress overview */}
      {estateWide.length > 0 && (
        <div className="mx-6 mt-6 rounded-lg border border-border bg-background p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Overall Estate Progress</p>
              {latestPhase && (
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  Current phase: {latestPhase}
                </p>
              )}
            </div>
            <p
              className="text-3xl font-semibold text-primary"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {overallProgress}%
            </p>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-6 py-3 mt-6">
        {(['all', 'estate-wide', 'lot-specific'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterScope(s)}
            className={
              filterScope === s
                ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground'
                : 'rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted'
            }
          >
            {s === 'all' ? 'All updates' : s === 'estate-wide' ? 'Estate-wide' : 'Lot-specific'}
          </button>
        ))}
        {allPhases.length > 0 && (
          <select
            className="ml-auto rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
          >
            <option value="">All phases</option>
            {allPhases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Updates feed */}
      <div className="px-6 py-6">
        {updates.length === 0 ? (
          <EmptyState
            icon={HardHat}
            heading="No construction updates yet"
            description="Your estate manager will post progress updates here as development phases begin. You'll see estate-wide and lot-specific milestones as they're logged."
            ctaLabel={isManagerOrAdmin ? 'Post first update' : undefined}
            onCta={isManagerOrAdmin ? openCreate : undefined}
            ctaVisible={isManagerOrAdmin}
          />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No updates match the current filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge variant={u.scope} />
                    <span className="text-xs text-muted-foreground">{u.phase}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isManagerOrAdmin && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(u)} className="h-7 w-7">
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <Trash size={13} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <h3
                  className="mt-2 text-base font-semibold text-foreground"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {u.title}
                </h3>
                {u.lotNumber && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Lot {u.lotNumber}</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium text-foreground">{u.progressPercent}%</span>
                  </div>
                  <Progress value={u.progressPercent} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Posted by {u.postedBy}</span>
                  <span>·</span>
                  <span>{formatDate(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>
              {editTarget ? 'Edit update' : 'Post construction update'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cu-title">Title</Label>
              <Input
                id="cu-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Earthworks completion — Stage 2"
                className={formErrors.title ? 'border-destructive' : ''}
              />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cu-phase">Phase</Label>
                <Input
                  id="cu-phase"
                  value={formData.phase}
                  onChange={(e) => setFormData((p) => ({ ...p, phase: e.target.value }))}
                  placeholder="e.g. Earthworks"
                  className={formErrors.phase ? 'border-destructive' : ''}
                />
                {formErrors.phase && <p className="text-xs text-destructive">{formErrors.phase}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-progress">Progress (%)</Label>
                <Input
                  id="cu-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.progressPercent}
                  onChange={(e) => setFormData((p) => ({ ...p, progressPercent: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-scope">Scope</Label>
              <Select
                id="cu-scope"
                value={formData.scope}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, scope: e.target.value as 'estate-wide' | 'lot-specific' }))
                }
              >
                <option value="estate-wide">Estate-wide</option>
                <option value="lot-specific">Lot-specific</option>
              </Select>
            </div>
            {formData.scope === 'lot-specific' && (
              <div className="space-y-1.5">
                <Label htmlFor="cu-lot">Lot number</Label>
                <Input
                  id="cu-lot"
                  value={formData.lotNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, lotNumber: e.target.value }))}
                  placeholder="e.g. LOT-12"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="cu-body">Details</Label>
              <Textarea
                id="cu-body"
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                placeholder="Describe the work completed, current status, and next steps."
                className={formErrors.body ? 'border-destructive' : ''}
              />
              {formErrors.body && <p className="text-xs text-destructive">{formErrors.body}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editTarget ? 'Save changes' : 'Post update'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Remove this update?"
        description="This action cannot be undone. The update will be permanently removed."
        confirmLabel="Yes, remove update"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
