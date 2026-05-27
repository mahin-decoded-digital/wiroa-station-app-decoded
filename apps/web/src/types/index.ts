export interface User {
  id: string;
  createdAt: Date;
  email: string;
  password: string;
  fullName: string;
  role: 'owner' | 'manager' | 'board_member' | 'admin';
  lotNumber: string | null;
  avatarInitials: string;
  isBoardMember: boolean;
}

export interface ConstructionUpdate {
  id: string;
  createdAt: Date;
  lotNumber: string | null;
  scope: 'estate-wide' | 'lot-specific';
  phase: string;
  title: string;
  body: string;
  progressPercent: number;
  postedBy: string;
  attachmentUrls: string[];
}

export interface BoardCandidate {
  id: string;
  createdAt: Date;
  userId: string;
  fullName: string;
  lotNumber: string;
  statement: string;
  electionId: string;
}

export interface Election {
  id: string;
  createdAt: Date;
  title: string;
  description: string;
  opensAt: Date;
  closesAt: Date;
  status: 'upcoming' | 'open' | 'closed';
  maxVotesPerOwner: number;
  seatsAvailable: number;
}

export interface Vote {
  id: string;
  createdAt: Date;
  electionId: string;
  voterId: string;
  candidateId: string;
}

export interface LevyPayment {
  id: string;
  createdAt: Date;
  ownerId: string;
  lotNumber: string;
  amountNZD: number;
  dueDate: Date;
  paidDate: Date | null;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  receiptRef: string | null;
}

export interface Document {
  id: string;
  createdAt: Date;
  title: string;
  category: 'legal' | 'planning' | 'minutes' | 'financial' | 'technical' | 'correspondence';
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  accessLevel: 'all-owners' | 'board-only' | 'manager-only';
  tags: string[];
}

export interface IwiNotice {
  id: string;
  createdAt: Date;
  title: string;
  body: string;
  category: 'consultation' | 'update' | 'meeting' | 'decision' | 'cultural';
  postedBy: string;
  attachmentUrls: string[];
  requiresAcknowledgement: boolean;
  acknowledgedBy: string[];
}
