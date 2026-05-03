export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'round_robin' | 'single_elimination' | 'double_elimination' | 'ladder';
  status: 'draft' | 'active' | 'completed';
  ownerId: string;
  captains?: string[];
  price?: number;
  maxPlayers?: number;
  createdAt: string;
  rules?: any;
}

export interface Player {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  rating?: number;
}

export interface Registration {
  id: string;
  playerId: string;
  tournamentId: string;
  teamName: string;
  checkedIn: boolean;
  paymentStatus?: 'unpaid' | 'paid';
  wins: number;
  losses: number;
  ringers?: number;
  doubleRingers?: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface MatchStats {
  ringers: number;
  doubles: number;
  singles: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  stats1?: MatchStats;
  stats2?: MatchStats;
  status: 'pending' | 'in_progress' | 'completed';
  court?: string;
  updatedAt: string;
}

export interface Club {
  id: string;
  name: string;
  location: string;
  description: string;
  ownerId: string;
  createdAt: any;
  eventsCount?: number;
}
