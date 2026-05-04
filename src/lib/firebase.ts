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
  } catch (error: any) {
    console.error('Sign-in failed. Error code:', error.code);
    console.error('Sign-in failed. Error message:', error.message);
    
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      const projectId = firebaseConfig.projectId;
      const consoleUrl = `https://console.firebase.google.com/u/0/project/${projectId}/authentication/settings`;
      
      console.error('UNAUTHORIZED DOMAIN:', currentDomain);
      alert(`AUTH ERROR: This domain (${currentDomain}) is not authorized in your Firebase Project.\n\n` +
            `1. Go to: ${consoleUrl}\n` +
            `2. Click "Authorized Domains"\n` +
            `3. Add "${currentDomain}" to the list.\n\n` +
            `Note: Ensure you are logged into Google with mtgloanpro@gmail.com`);
    } else if (error.code === 'auth/popup-blocked') {
      alert('AUTH ERROR: The sign-in popup was blocked by your browser. Please enable popups for this site and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('Sign-in popup request cancelled.');
    } else {
      alert(`Sign-in failed: ${error.message || 'Unknown error'}`);
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
