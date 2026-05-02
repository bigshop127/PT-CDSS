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
    // Auto-login test user for emulator testing
    const login = async () => {
      const email = 'test@example.com';
      const password = 'password123';
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged into Emulator Auth");
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          try {
            console.log("User not found, creating test account...");
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Test account created and logged in");
          } catch (createErr) {
            console.error("Failed to create test user:", createErr);
          }
        } else {
          console.error("Auth Error:", e);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsReady(true);
      else login();
    });

    return () => unsubscribe();
  }, []);

  if (!isReady) return <div className="p-10 text-slate-500">Authenticating with Emulator...</div>;

  return <Workspace projectId="test-project" userId="user-123" />;
}

export default App;
