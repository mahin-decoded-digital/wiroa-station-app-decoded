import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIwiStore } from '@/stores/useIwiStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
import { Leaf, Plus, Trash, Check, Users } from 'lucide-react';
import type { IwiNotice } from '@/types';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CATEGORIES: Array<IwiNotice['category'] | 'all'> = [
  'all', 'consultation', 'update', 'meeting', 'decision', 'cultural',
];

export default function IwiPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const notices = useIwiStore((s) => s.notices);
  const filterCategory = useIwiStore((s) => s.filterCategory);
  const addNotice = useIwiStore((s) => s.addNotice);
  const acknowledgeNotice = useIwiStore((s) => s.acknowledgeNotice);
  const removeNotice = useIwiStore((s) => s.removeNotice);
  const setFilterCategory = useIwiStore((s) => s.setFilterCategory);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    category: 'update' as IwiNotice['category'],
    requiresAcknowledgement: false,
  });
  const [noticeErrors, setNoticeErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return notices;
    return notices.filter((n) => n.category === filterCategory);
  }, [notices, filterCategory]);

  const hasAcknowledged = (notice: IwiNotice) =>
    currentUser ? notice.acknowledgedBy.includes(currentUser.id) : false;

  const validateNotice = () => {
    const e: Record<string, string> = {};
    if (!noticeForm.title.trim()) e.title = 'Title is required.';
    if (!noticeForm.body.trim()) e.body = 'Notice body is required.';
    return e;
  };

  const handlePost = (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validateNotice();
    if (Object.keys(e).length > 0) { setNoticeErrors(e); return; }
    if (!currentUser) return;
    addNotice({
      title: noticeForm.title.trim(),
      body: noticeForm.body.trim(),
      category: noticeForm.category,
      postedBy: currentUser.fullName,
      attachmentUrls: [],
      requiresAcknowledgement: noticeForm.requiresAcknowledgement,
      acknowledgedBy: [],
    });
    setPostDialogOpen(false);
    setNoticeForm({ title: '', body: '', category: 'update', requiresAcknowledgement: false });
    setNoticeErrors({});
  };

  const handleAcknowledge = (noticeId: string) => {
    if (!currentUser) return;
    acknowledgeNotice(noticeId, currentUser.id);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeNotice(deleteId);
    toast.success('Notice removed.');
    setDeleteId(null);
  };

  return (
    <div>
      {/* Feature image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/32947411/pexels-photo-32947411.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="New Zealand cultural landscape"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, hsl(152 30% 10% / 0.6) 0%, transparent 60%)' }}
        />
        <div className="absolute inset-0 flex items-end px-6 pb-4">
          <p
            className="text-lg font-semibold text-primary-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Iwi Liaison
          </p>
        </div>
      </div>

      <PageHeader
        title="Iwi Liaison"
        description="This noticeboard records consultation updates, cultural notices, and engagement outcomes between Wiroa Station and its Iwi partners. Keeping all co-owners informed is a shared responsibility."
        actions={
          isManagerOrAdmin ? (
            <Button size="sm" onClick={() => setPostDialogOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Post notice
            </Button>
          ) : null
        }
      />

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-6 py-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={
              filterCategory === cat
                ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground'
                : 'rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted capitalize'
            }
          >
            {cat === 'all' ? 'All notices' : cat}
          </button>
        ))}
      </div>

      {/* Notice board */}
      <div className="px-6 py-6 max-w-3xl">
        {notices.length === 0 ? (
          <EmptyState
            icon={Leaf}
            heading="No notices posted yet"
            description="Updates from and about the Wiroa Station Iwi liaison process will be shared here — consultations, meeting outcomes, and cultural notices relevant to the estate."
            ctaLabel={isManagerOrAdmin ? 'Post first notice' : undefined}
            onCta={isManagerOrAdmin ? () => setPostDialogOpen(true) : undefined}
            ctaVisible={isManagerOrAdmin}
          />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No notices in this category.
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((notice) => {
              const acknowledged = hasAcknowledged(notice);
              return (
                <div
                  key={notice.id}
                  className="rounded-lg border border-border bg-background p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge variant={notice.category} />
                      {notice.requiresAcknowledgement && (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-[var(--status-pending-bg)] text-[var(--status-pending)]">
                          Acknowledgement required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {notice.requiresAcknowledgement && acknowledged && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--status-paid)]">
                          <Check size={12} />
                          Acknowledged
                        </span>
                      )}
                      {isManagerOrAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(notice.id)}
                        >
                          <Trash size={13} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <h3
                    className="mt-3 text-base font-semibold text-foreground"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {notice.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {notice.body}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Posted by {notice.postedBy}</span>
                      <span>·</span>
                      <span>{formatDate(notice.createdAt)}</span>
                      {notice.acknowledgedBy.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {notice.acknowledgedBy.length} acknowledged
                          </span>
                        </>
                      )}
                    </div>
                    {notice.requiresAcknowledgement && !acknowledged && currentUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(notice.id)}
                        className="h-7 text-xs"
                      >
                        <Check size={12} className="mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post notice dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Post Iwi liaison notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePost} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="iwi-title">Title</Label>
              <Input
                id="iwi-title"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Consultation meeting — 14 March 2025"
                className={noticeErrors.title ? 'border-destructive' : ''}
              />
              {noticeErrors.title && <p className="text-xs text-destructive">{noticeErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iwi-category">Category</Label>
              <Select
                id="iwi-category"
                value={noticeForm.category}
                onChange={(e) => setNoticeForm((p) => ({ ...p, category: e.target.value as IwiNotice['category'] }))}
              >
                <option value="consultation">Consultation</option>
                <option value="update">Update</option>
                <option value="meeting">Meeting</option>
                <option value="decision">Decision</option>
                <option value="cultural">Cultural</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iwi-body">Notice</Label>
              <Textarea
                id="iwi-body"
                rows={5}
                value={noticeForm.body}
                onChange={(e) => setNoticeForm((p) => ({ ...p, body: e.target.value }))}
                placeholder="Provide the full notice text. Be clear, respectful, and complete."
                className={noticeErrors.body ? 'border-destructive' : ''}
              />
              {noticeErrors.body && <p className="text-xs text-destructive">{noticeErrors.body}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="iwi-ack"
                checked={noticeForm.requiresAcknowledgement}
                onChange={(e) => setNoticeForm((p) => ({ ...p, requiresAcknowledgement: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="iwi-ack" className="cursor-pointer">
                Require acknowledgement from co-owners
              </Label>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Post notice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Remove this notice?"
        description="This will permanently remove the notice from the Iwi liaison board."
        confirmLabel="Yes, remove"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
