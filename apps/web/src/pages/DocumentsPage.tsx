import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { FolderOpen, Plus, Trash, FileText, Search, Download } from 'lucide-react';
import type { Document } from '@/types';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORIES: Array<Document['category'] | 'all'> = [
  'all', 'legal', 'planning', 'minutes', 'financial', 'technical', 'correspondence',
];

const ACCESS_OPTIONS: Array<{ value: Document['accessLevel']; label: string }> = [
  { value: 'all-owners', label: 'All owners' },
  { value: 'board-only', label: 'Board only' },
  { value: 'manager-only', label: 'Manager only' },
];

export default function DocumentsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const documents = useDocumentStore((s) => s.documents);
  const filterCategory = useDocumentStore((s) => s.filterCategory);
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const removeDocument = useDocumentStore((s) => s.removeDocument);
  const setFilterCategory = useDocumentStore((s) => s.setFilterCategory);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const isBoardOrManager =
    currentUser?.role === 'board_member' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin';

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'legal' as Document['category'],
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    accessLevel: 'all-owners' as Document['accessLevel'],
    tags: '',
  });
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Access-level filtering
  const accessible = useMemo(() => {
    return documents.filter((d) => {
      if (d.accessLevel === 'all-owners') return true;
      if (d.accessLevel === 'board-only' && isBoardOrManager) return true;
      if (d.accessLevel === 'manager-only' && isManagerOrAdmin) return true;
      return false;
    });
  }, [documents, isBoardOrManager, isManagerOrAdmin]);

  const filtered = useMemo(() => {
    let result = accessible;
    if (filterCategory !== 'all') result = result.filter((d) => d.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [accessible, filterCategory, searchQuery]);

  const validateDoc = () => {
    const e: Record<string, string> = {};
    if (!docForm.title.trim()) e.title = 'Title is required.';
    if (!docForm.fileName.trim()) e.fileName = 'File name is required.';
    return e;
  };

  const handleUpload = (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validateDoc();
    if (Object.keys(e).length > 0) { setDocErrors(e); return; }
    if (!currentUser) return;
    addDocument({
      title: docForm.title.trim(),
      category: docForm.category,
      description: docForm.description.trim(),
      fileUrl: docForm.fileUrl.trim() || '#',
      fileName: docForm.fileName.trim(),
      fileSize: docForm.fileSize.trim() || 'Unknown',
      uploadedBy: currentUser.fullName,
      accessLevel: docForm.accessLevel,
      tags: docForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setUploadDialogOpen(false);
    setDocForm({ title: '', category: 'legal', description: '', fileUrl: '', fileName: '', fileSize: '', accessLevel: 'all-owners', tags: '' });
    setDocErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeDocument(deleteId);
    toast.success('Document removed.');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Document Vault"
        description="Secure, categorised repository for all estate documentation — legal, planning, minutes, financial, and technical records."
        actions={
          isManagerOrAdmin ? (
            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Upload document
            </Button>
          ) : null
        }
      />

      {/* Search and filter */}
      <div className="border-b border-border bg-background px-6 py-4 space-y-3">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document grid */}
      <div className="px-6 py-6">
        {documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            heading="The vault is empty"
            description="Legal agreements, planning documents, board minutes, and financial records will be stored here as your estate manager uploads them."
            ctaLabel={isManagerOrAdmin ? 'Upload first document' : undefined}
            onCta={isManagerOrAdmin ? () => setUploadDialogOpen(true) : undefined}
            ctaVisible={isManagerOrAdmin}
          />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No documents match your search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-lg border border-border bg-background p-5 cursor-pointer transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                style={{ boxShadow: 'var(--shadow-card)' }}
                onClick={() => setDetailDoc(doc)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <StatusBadge variant={doc.category} />
                </div>
                <h3
                  className="text-sm font-semibold text-foreground leading-snug line-clamp-2"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {doc.title}
                </h3>
                {doc.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{doc.fileName}</span>
                  <span className="shrink-0 ml-2">{doc.fileSize}</span>
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  Uploaded {formatDate(doc.createdAt)} by {doc.uploadedBy}
                </div>
                {isManagerOrAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id); }}
                    className="absolute right-2 top-2 hidden group-hover:flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                  >
                    <Trash size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Upload document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={docForm.title}
                onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Section 32 Agreement — Lot 12"
                className={docErrors.title ? 'border-destructive' : ''}
              />
              {docErrors.title && <p className="text-xs text-destructive">{docErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-category">Category</Label>
                <Select
                  id="doc-category"
                  value={docForm.category}
                  onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value as Document['category'] }))}
                >
                  <option value="legal">Legal</option>
                  <option value="planning">Planning</option>
                  <option value="minutes">Minutes</option>
                  <option value="financial">Financial</option>
                  <option value="technical">Technical</option>
                  <option value="correspondence">Correspondence</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-access">Access level</Label>
                <Select
                  id="doc-access"
                  value={docForm.accessLevel}
                  onChange={(e) => setDocForm((p) => ({ ...p, accessLevel: e.target.value as Document['accessLevel'] }))}
                >
                  {ACCESS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-desc">Description</Label>
              <Textarea
                id="doc-desc"
                rows={2}
                value={docForm.description}
                onChange={(e) => setDocForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the document's contents."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-filename">File name</Label>
                <Input
                  id="doc-filename"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm((p) => ({ ...p, fileName: e.target.value }))}
                  placeholder="e.g. s32-lot12.pdf"
                  className={docErrors.fileName ? 'border-destructive' : ''}
                />
                {docErrors.fileName && <p className="text-xs text-destructive">{docErrors.fileName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-size">File size</Label>
                <Input
                  id="doc-size"
                  value={docForm.fileSize}
                  onChange={(e) => setDocForm((p) => ({ ...p, fileSize: e.target.value }))}
                  placeholder="e.g. 2.4 MB"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-url">File URL</Label>
              <Input
                id="doc-url"
                value={docForm.fileUrl}
                onChange={(e) => setDocForm((p) => ({ ...p, fileUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-tags">Tags (comma-separated)</Label>
              <Input
                id="doc-tags"
                value={docForm.tags}
                onChange={(e) => setDocForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="e.g. resource consent, RMA, lot-12"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Upload document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailDoc !== null} onOpenChange={(o) => { if (!o) setDetailDoc(null); }}>
        {detailDoc && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>{detailDoc.title}</DialogTitle>
              <DialogDescription>{detailDoc.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                  <StatusBadge variant={detailDoc.category} className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Access</p>
                  <p className="mt-1 text-foreground capitalize">{detailDoc.accessLevel.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">File</p>
                  <p className="mt-1 text-foreground font-mono text-xs">{detailDoc.fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Size</p>
                  <p className="mt-1 text-foreground">{detailDoc.fileSize}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded</p>
                  <p className="mt-1 text-foreground">{formatDate(detailDoc.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded by</p>
                  <p className="mt-1 text-foreground">{detailDoc.uploadedBy}</p>
                </div>
              </div>
              {detailDoc.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailDoc.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Close</Button>
              </DialogClose>
              <a href={detailDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button>
                  <Download size={14} className="mr-1.5" />
                  Download
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Remove this document?"
        description="This will permanently remove the document record from the vault."
        confirmLabel="Yes, remove document"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
