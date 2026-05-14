import React, { useEffect, useState } from 'react';
import { Workspace } from '@/components/Workspace';
import { Onboarding } from '@/components/auth/Onboarding';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useUserStore } from '@/store/useUserStore';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { isConfigured, setUid, syncFromFirestore } = useUserStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        setUid(user.uid);
        await syncFromFirestore();
        
        // After syncing, check if configured
        if (!isConfigured()) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        setUid(null);
        setShowOnboarding(true);
      }
    });

    return () => unsubscribe();
  }, [isConfigured, setUid, syncFromFirestore]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
            Initializing Secure Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <Workspace 
      projectId="default-project" 
      userId={currentUser?.uid || "guest"} 
    />
  );
}

export default App;
