import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Non-sensitive public client configurations loaded dynamically from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

if (!isConfigValid) {
  console.warn(
    "AeroBlood Warning: Firebase credentials are not fully configured in your environment (.env or Vercel Environment Variables). " +
    "Please define VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to enable cloud-backed Authentication."
  );
}

// Fallback to a dummy configuration if empty, to prevent application load-time crash
const app = initializeApp(
  isConfigValid 
    ? firebaseConfig 
    : {
        apiKey: "placeholder-api-key",
        authDomain: "placeholder-auth-domain.firebaseapp.com",
        projectId: "placeholder-project-id",
        storageBucket: "placeholder-project.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:0000000000000000000000"
      }
);
export const auth = getAuth(app);
export const db = getFirestore(app);
