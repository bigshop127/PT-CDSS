import React, { useEffect, useState } from 'react';
import { Workspace } from '@/components/Workspace';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Auto-login test user for emulator testing (Dev mode only)
    const login = async () => {
      if (!import.meta.env.DEV) return;

      const email = import.meta.env.VITE_DEV_EMAIL || '';
      const password = import.meta.env.VITE_DEV_PASSWORD || '';
      
      if (!email || !password) {
        console.warn("Dev credentials missing in .env.local");
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr) {
            console.error("Failed to create test user:", createErr);
          }
        } else {
          console.error("Auth Error:", e);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsReady(true);
      } else if (import.meta.env.DEV) {
        login();
      } else {
        // Production: allow proceeding to workspace even without session for prototype
        setIsReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <div className="p-10 text-slate-500 font-medium">
        {import.meta.env.DEV ? "Authenticating with Emulator..." : "Initializing Workspace..."}
      </div>
    );
  }

  return <Workspace projectId="test-project" userId="user-123" />;
}

export default App;
