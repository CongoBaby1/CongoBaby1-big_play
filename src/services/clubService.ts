import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Club } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';

const CLUBS_COL = 'clubs';

export const clubService = {
  async createClub(data: Partial<Club>) {
    try {
      const docRef = await addDoc(collection(db, CLUBS_COL), {
        ...data,
        createdAt: Timestamp.now(),
        eventsCount: 0
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, CLUBS_COL);
    }
  },

  async getClubs() {
    try {
      const q = query(collection(db, CLUBS_COL), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, CLUBS_COL);
    }
  },

  subscribeToClubs(callback: (clubs: Club[]) => void) {
    const q = query(collection(db, CLUBS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, CLUBS_COL);
    });
  },

  async updateClub(id: string, data: Partial<Club>) {
    const docRef = doc(db, CLUBS_COL, id);
    try {
      await updateDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${CLUBS_COL}/${id}`);
    }
  },

  async deleteClub(id: string) {
    const docRef = doc(db, CLUBS_COL, id);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${CLUBS_COL}/${id}`);
    }
  }
};
