import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Election, BoardCandidate, Vote } from '@/types';

interface ElectionState {
  elections: Election[];
  candidates: BoardCandidate[];
  votes: Vote[];
  addElection: (input: Omit<Election, 'id' | 'createdAt'>) => void;
  updateElectionStatus: (id: string, status: Election['status']) => void;
  nominateCandidate: (input: Omit<BoardCandidate, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
  castVote: (input: Omit<Vote, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
}

export const useElectionStore = create<ElectionState>()(
  persist(
    (set, get) => ({
      elections: [],
      candidates: [],
      votes: [],

      addElection: (input) => {
        const newElection: Election = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ elections: [...state.elections, newElection] }));
      },

      updateElectionStatus: (id, status) => {
        set((state) => ({
          elections: state.elections.map((e) => (e.id === id ? { ...e, status } : e)),
        }));
      },

      nominateCandidate: (input) => {
        const { candidates } = get();
        const already = candidates.find(
          (c) => c.userId === input.userId && c.electionId === input.electionId
        );
        if (already) {
          return { ok: false, error: 'Already nominated' };
        }
        const newCandidate: BoardCandidate = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ candidates: [...state.candidates, newCandidate] }));
        return { ok: true };
      },

      castVote: (input) => {
        const { votes, elections } = get();
        const alreadyVotedForCandidate = votes.find(
          (v) =>
            v.voterId === input.voterId &&
            v.candidateId === input.candidateId &&
            v.electionId === input.electionId
        );
        if (alreadyVotedForCandidate) {
          return { ok: false, error: 'Already voted for this candidate' };
        }
        const election = elections.find((e) => e.id === input.electionId);
        if (election) {
          const voterVoteCount = votes.filter(
            (v) => v.voterId === input.voterId && v.electionId === input.electionId
          ).length;
          if (voterVoteCount >= election.maxVotesPerOwner) {
            return { ok: false, error: 'Maximum votes reached' };
          }
        }
        const newVote: Vote = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ votes: [...state.votes, newVote] }));
        return { ok: true };
      },
    }),
    { name: 'wiroa-elections' }
  )
);
