import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useElectionStore } from '@/stores/useElectionStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Vote, Plus, ChevronDown, ChevronRight, User } from 'lucide-react';
import type { Election } from '@/types';

function formatDate(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ElectionsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const elections = useElectionStore((s) => s.elections);
  const candidates = useElectionStore((s) => s.candidates);
  const votes = useElectionStore((s) => s.votes);
  const addElection = useElectionStore((s) => s.addElection);
  const nominateCandidate = useElectionStore((s) => s.nominateCandidate);
  const castVote = useElectionStore((s) => s.castVote);

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'board_member';

  // Election dialog
  const [electionDialogOpen, setElectionDialogOpen] = useState(false);
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    opensAt: '',
    closesAt: '',
    maxVotesPerOwner: '1',
    seatsAvailable: '3',
  });
  const [electionErrors, setElectionErrors] = useState<Record<string, string>>({});

  // Nomination dialog
  const [nomDialogOpen, setNomDialogOpen] = useState(false);
  const [nomElectionId, setNomElectionId] = useState('');
  const [nomStatement, setNomStatement] = useState('');
  const [nomError, setNomError] = useState('');

  // Expanded elections
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const openElection = useMemo(
    () => elections.find((e) => e.status === 'open') ?? null,
    [elections]
  );

  const historicalElections = useMemo(
    () => elections.filter((e) => e.status !== 'open'),
    [elections]
  );

  const getCandidatesForElection = (electionId: string) =>
    candidates.filter((c) => c.electionId === electionId);

  const getVoteCount = (electionId: string, candidateId: string) =>
    votes.filter((v) => v.electionId === electionId && v.candidateId === candidateId).length;

  const hasVotedForCandidate = (electionId: string, candidateId: string) =>
    currentUser
      ? votes.some(
          (v) =>
            v.electionId === electionId &&
            v.candidateId === candidateId &&
            v.voterId === currentUser.id
        )
      : false;

  const voterVoteCount = (electionId: string) =>
    currentUser
      ? votes.filter((v) => v.electionId === electionId && v.voterId === currentUser.id).length
      : 0;

  const isNominated = (electionId: string) =>
    currentUser
      ? candidates.some((c) => c.electionId === electionId && c.userId === currentUser.id)
      : false;

  const validateElectionForm = () => {
    const e: Record<string, string> = {};
    if (!electionForm.title.trim()) e.title = 'Title is required.';
    if (!electionForm.opensAt) e.opensAt = 'Opens date is required.';
    if (!electionForm.closesAt) e.closesAt = 'Closes date is required.';
    return e;
  };

  const handleCreateElection = (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validateElectionForm();
    if (Object.keys(e).length > 0) {
      setElectionErrors(e);
      return;
    }
    addElection({
      title: electionForm.title.trim(),
      description: electionForm.description.trim(),
      opensAt: new Date(electionForm.opensAt),
      closesAt: new Date(electionForm.closesAt),
      status: 'upcoming',
      maxVotesPerOwner: parseInt(electionForm.maxVotesPerOwner) || 1,
      seatsAvailable: parseInt(electionForm.seatsAvailable) || 3,
    });
    setElectionDialogOpen(false);
    setElectionForm({ title: '', description: '', opensAt: '', closesAt: '', maxVotesPerOwner: '1', seatsAvailable: '3' });
  };

  const handleNominate = (electionId: string) => {
    setNomElectionId(electionId);
    setNomStatement('');
    setNomError('');
    setNomDialogOpen(true);
  };

  const submitNomination = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!currentUser) return;
    if (!nomStatement.trim()) { setNomError('Please provide a statement.'); return; }
    const result = nominateCandidate({
      userId: currentUser.id,
      fullName: currentUser.fullName,
      lotNumber: currentUser.lotNumber ?? '',
      statement: nomStatement.trim(),
      electionId: nomElectionId,
    });
    if (result.ok) {
      setNomDialogOpen(false);
    } else {
      setNomError(result.error ?? 'Nomination failed.');
      toast.error(result.error ?? 'Nomination failed.');
    }
  };

  const handleVote = (electionId: string, candidateId: string, election: Election) => {
    if (!currentUser) return;
    const count = voterVoteCount(electionId);
    if (count >= election.maxVotesPerOwner) {
      toast.error('Maximum votes reached for this election.');
      return;
    }
    const result = castVote({
      electionId,
      voterId: currentUser.id,
      candidateId,
    });
    if (!result.ok) {
      toast.error(result.error ?? 'Vote failed.');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        title="Advisory Board"
        description="Governance hub — run elections, nominate candidates, and cast votes for the advisory board."
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setElectionDialogOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Open election
            </Button>
          ) : null
        }
      />

      <div className="px-6 py-6 space-y-8 max-w-4xl">
        {elections.length === 0 ? (
          <EmptyState
            icon={Vote}
            heading="No elections scheduled"
            description="Advisory board elections will appear here when the estate administrator opens a new election. Co-owners can nominate themselves and vote during the election window."
            ctaLabel={isAdmin ? 'Create first election' : undefined}
            onCta={isAdmin ? () => setElectionDialogOpen(true) : undefined}
            ctaVisible={isAdmin}
          />
        ) : (
          <>
            {/* Active election */}
            {openElection && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Open Election
                </h2>
                <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle style={{ fontFamily: 'var(--font-serif)' }}>
                          {openElection.title}
                        </CardTitle>
                        {openElection.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{openElection.description}</p>
                        )}
                      </div>
                      <StatusBadge variant="open" label="Voting open" />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Closes {formatDate(openElection.closesAt)}</span>
                      <span>·</span>
                      <span>{openElection.seatsAvailable} seat{openElection.seatsAvailable !== 1 ? 's' : ''} available</span>
                      <span>·</span>
                      <span>Up to {openElection.maxVotesPerOwner} vote{openElection.maxVotesPerOwner !== 1 ? 's' : ''} per owner</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Candidates */}
                    {getCandidatesForElection(openElection.id).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">No candidates have nominated yet.</p>
                        {(isOwner || currentUser?.role === 'manager') && !isNominated(openElection.id) && (
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => handleNominate(openElection.id)}>
                            Nominate myself
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getCandidatesForElection(openElection.id).map((candidate) => {
                          const voteCount = getVoteCount(openElection.id, candidate.id);
                          const voted = hasVotedForCandidate(openElection.id, candidate.id);
                          const canVote = !voted && isOwner && voterVoteCount(openElection.id) < openElection.maxVotesPerOwner;
                          return (
                            <div
                              key={candidate.id}
                              className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-4"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <User size={16} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{candidate.fullName}</p>
                                  {candidate.lotNumber && (
                                    <span className="text-xs text-muted-foreground">Lot {candidate.lotNumber}</span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{candidate.statement}</p>
                                <div className="mt-2 flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">
                                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                  </span>
                                  {voted && (
                                    <span className="text-xs text-primary font-medium">✓ Voted</span>
                                  )}
                                </div>
                              </div>
                              {canVote && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVote(openElection.id, candidate.id, openElection)}
                                >
                                  Cast vote
                                </Button>
                              )}
                            </div>
                          );
                        })}
                        {(isOwner || currentUser?.role === 'manager') && !isNominated(openElection.id) && (
                          <Button size="sm" variant="outline" onClick={() => handleNominate(openElection.id)}>
                            Nominate myself
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* History */}
            {historicalElections.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Election History
                </h2>
                <div className="space-y-2">
                  {historicalElections.map((election) => {
                    const expanded = expandedIds.has(election.id);
                    const electionCandidates = getCandidatesForElection(election.id);
                    return (
                      <div
                        key={election.id}
                        className="rounded-lg border border-border bg-background overflow-hidden"
                        style={{ boxShadow: 'var(--shadow-card)' }}
                      >
                        <button
                          className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                          onClick={() => toggleExpanded(election.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-sm font-medium text-foreground"
                                style={{ fontFamily: 'var(--font-serif)' }}
                              >
                                {election.title}
                              </span>
                              <StatusBadge variant={election.status} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(election.opensAt)} – {formatDate(election.closesAt)} · {election.seatsAvailable} seats
                            </p>
                          </div>
                          {expanded ? <ChevronDown size={16} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={16} className="shrink-0 text-muted-foreground" />}
                        </button>
                        {expanded && (
                          <div className="border-t border-border px-5 py-4">
                            {electionCandidates.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No candidates on record.</p>
                            ) : (
                              <div className="space-y-2">
                                {electionCandidates
                                  .sort((a, b) => getVoteCount(election.id, b.id) - getVoteCount(election.id, a.id))
                                  .map((c) => (
                                    <div key={c.id} className="flex items-center gap-3">
                                      <span className="flex-1 text-sm text-foreground">{c.fullName}</span>
                                      {c.lotNumber && <span className="text-xs text-muted-foreground">Lot {c.lotNumber}</span>}
                                      <span className="text-sm font-medium text-foreground">
                                        {getVoteCount(election.id, c.id)} vote{getVoteCount(election.id, c.id) !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Create election dialog */}
      <Dialog open={electionDialogOpen} onOpenChange={setElectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Open new election</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateElection} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="el-title">Election title</Label>
              <Input
                id="el-title"
                value={electionForm.title}
                onChange={(e) => setElectionForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 2025 Advisory Board Election"
                className={electionErrors.title ? 'border-destructive' : ''}
              />
              {electionErrors.title && <p className="text-xs text-destructive">{electionErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="el-desc">Description</Label>
              <Textarea
                id="el-desc"
                rows={2}
                value={electionForm.description}
                onChange={(e) => setElectionForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief context for co-owners."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="el-opens">Opens</Label>
                <Input
                  id="el-opens"
                  type="date"
                  value={electionForm.opensAt}
                  onChange={(e) => setElectionForm((p) => ({ ...p, opensAt: e.target.value }))}
                  className={electionErrors.opensAt ? 'border-destructive' : ''}
                />
                {electionErrors.opensAt && <p className="text-xs text-destructive">{electionErrors.opensAt}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="el-closes">Closes</Label>
                <Input
                  id="el-closes"
                  type="date"
                  value={electionForm.closesAt}
                  onChange={(e) => setElectionForm((p) => ({ ...p, closesAt: e.target.value }))}
                  className={electionErrors.closesAt ? 'border-destructive' : ''}
                />
                {electionErrors.closesAt && <p className="text-xs text-destructive">{electionErrors.closesAt}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="el-seats">Seats available</Label>
                <Input
                  id="el-seats"
                  type="number"
                  min={1}
                  value={electionForm.seatsAvailable}
                  onChange={(e) => setElectionForm((p) => ({ ...p, seatsAvailable: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="el-maxvotes">Max votes per owner</Label>
                <Input
                  id="el-maxvotes"
                  type="number"
                  min={1}
                  value={electionForm.maxVotesPerOwner}
                  onChange={(e) => setElectionForm((p) => ({ ...p, maxVotesPerOwner: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Open election</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nominate dialog */}
      <Dialog open={nomDialogOpen} onOpenChange={setNomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>Nominate yourself</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitNomination} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nom-statement">Candidate statement</Label>
              <Textarea
                id="nom-statement"
                rows={4}
                value={nomStatement}
                onChange={(e) => setNomStatement(e.target.value)}
                placeholder="Briefly describe your interest and relevant experience."
                className={nomError ? 'border-destructive' : ''}
              />
              {nomError && <p className="text-xs text-destructive">{nomError}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Nominate myself</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
