import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log('Initiating Google Sign-In...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Sign-in successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('Sign-in failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('auth/unauthorized-domain')) {
        console.error('ERROR: This domain is not authorized in the Firebase Console. Please add your Vercel domain to the "Authorized Domains" list in Authentication Settings.');
      }
    }
    throw error;
  }
};
export const logout = () => signOut(auth);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or connectivity.');
    }
  }
}

testConnection();
