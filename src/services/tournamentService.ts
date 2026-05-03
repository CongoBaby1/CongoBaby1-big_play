import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tournament, Registration, Match, Player } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';

const TOURNAMENTS_COL = 'tournaments';

export const tournamentService = {
  async createTournament(data: Partial<Tournament>) {
    try {
      const docRef = await addDoc(collection(db, TOURNAMENTS_COL), {
        ...data,
        createdAt: Timestamp.now(),
        status: 'draft'
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, TOURNAMENTS_COL);
    }
  },

  async getTournaments() {
    try {
      const q = query(collection(db, TOURNAMENTS_COL), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, TOURNAMENTS_COL);
    }
  },

  subscribeToTournament(id: string, callback: (t: Tournament) => void) {
    const docRef = doc(db, TOURNAMENTS_COL, id);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Tournament);
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, `${TOURNAMENTS_COL}/${id}`);
    });
  },

  async updateTournament(id: string, data: Partial<Tournament>) {
    const docRef = doc(db, TOURNAMENTS_COL, id);
    try {
      await updateDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${TOURNAMENTS_COL}/${id}`);
    }
  },

  async addCaptain(tournamentId: string, tournament: Tournament, userId: string) {
    const captains = tournament.captains || [];
    if (!captains.includes(userId)) {
      await this.updateTournament(tournamentId, { captains: [...captains, userId] });
    }
  },

  async removeCaptain(tournamentId: string, tournament: Tournament, userId: string) {
    const captains = tournament.captains || [];
    await this.updateTournament(tournamentId, { captains: captains.filter(id => id !== userId) });
  },

  async registerPlayer(tournamentId: string, player: Partial<Player>, teamName?: string) {
    const path = `${TOURNAMENTS_COL}/${tournamentId}/registrations`;
    try {
      const docRef = await addDoc(collection(db, path), {
        playerId: player.id || `manual_${Date.now()}`,
        tournamentId,
        teamName: teamName || player.displayName || 'Unknown Player',
        checkedIn: true,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  subscribeToRegistrations(tournamentId: string, callback: (regs: Registration[]) => void) {
    const path = `${TOURNAMENTS_COL}/${tournamentId}/registrations`;
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration)));
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, path);
    });
  },

  async createMatch(tournamentId: string, match: Partial<Match>) {
    const path = `${TOURNAMENTS_COL}/${tournamentId}/matches`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...match,
        tournamentId,
        score1: 0,
        score2: 0,
        status: 'pending',
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  subscribeToMatches(tournamentId: string, callback: (matches: Match[]) => void) {
    const path = `${TOURNAMENTS_COL}/${tournamentId}/matches`;
    const q = query(collection(db, path), orderBy('round', 'asc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, path);
    });
  },

  async updateMatchScore(tournamentId: string, matchId: string, data: { score1: number, score2: number, stats1?: any, stats2?: any, status: Match['status'] }) {
    const path = `${TOURNAMENTS_COL}/${tournamentId}/matches/${matchId}`;
    try {
      const docRef = doc(db, path);
      const prevMatchSnap = await getDoc(docRef);
      const prevMatch = prevMatchSnap.data() as Match;
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      // If completing, update registration stats
      if (data.status === 'completed' && prevMatch.status !== 'completed') {
        const regsPath = `${TOURNAMENTS_COL}/${tournamentId}/registrations`;
        const q1 = query(collection(db, regsPath), where('playerId', '==', prevMatch.player1Id));
        const q2 = query(collection(db, regsPath), where('playerId', '==', prevMatch.player2Id));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const reg1 = snap1.docs[0];
        const reg2 = snap2.docs[0];

        if (reg1 && reg2) {
          const r1Data = reg1.data();
          const r2Data = reg2.data();

          const update1 = {
            wins: r1Data.wins + (data.score1 > data.score2 ? 1 : 0),
            losses: r1Data.losses + (data.score1 < data.score2 ? 1 : 0),
            pointsFor: r1Data.pointsFor + data.score1,
            pointsAgainst: r1Data.pointsAgainst + data.score2,
            ringers: (r1Data.ringers || 0) + (data.stats1?.ringers || 0),
            doubleRingers: (r1Data.doubleRingers || 0) + (data.stats1?.doubles || 0),
          };

          const update2 = {
            wins: r2Data.wins + (data.score2 > data.score1 ? 1 : 0),
            losses: r2Data.losses + (data.score2 < data.score1 ? 1 : 0),
            pointsFor: r2Data.pointsFor + data.score2,
            pointsAgainst: r2Data.pointsAgainst + data.score1,
            ringers: (r2Data.ringers || 0) + (data.stats2?.ringers || 0),
            doubleRingers: (r2Data.doubleRingers || 0) + (data.stats2?.doubles || 0),
          };

          await Promise.all([
            updateDoc(doc(db, regsPath, reg1.id), update1),
            updateDoc(doc(db, regsPath, reg2.id), update2)
          ]);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }
};
