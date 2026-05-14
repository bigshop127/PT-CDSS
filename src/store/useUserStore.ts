import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserSettings {
  openaiKey?: string;
  geminiKey?: string;
  preferredModel: 'gpt-4o' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-2.0-flash';
  googleLinked: boolean;
  name: string;
  role: string;
}

interface UserStore {
  uid: string | null;
  settings: UserSettings;
  setUid: (uid: string | null) => void;
  setKeys: (keys: { openaiKey?: string; geminiKey?: string }) => void;
  setProfile: (profile: Partial<UserSettings>) => void;
  isConfigured: () => boolean;
  syncFromFirestore: () => Promise<void>;
  syncToFirestore: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      uid: null,
      settings: {
        preferredModel: 'gemini-1.5-flash',
        googleLinked: false,
        name: 'Dr. Chen',
        role: 'Physical Therapist'
      },
      setUid: (uid) => set({ uid }),
      setKeys: (keys) => {
        set((state) => ({ 
          settings: { ...state.settings, ...keys } 
        }));
        get().syncToFirestore();
      },
      setProfile: (profile) => {
        set((state) => ({ 
          settings: { ...state.settings, ...profile } 
        }));
        get().syncToFirestore();
      },
      isConfigured: () => {
        const { settings } = get();
        return !!(settings.openaiKey || settings.geminiKey);
      },
      syncFromFirestore: async () => {
        const { uid } = get();
        if (!uid) return;
        try {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserSettings;
            set({ settings: { ...get().settings, ...data } });
          }
        } catch (error) {
          console.error("Error syncing from Firestore:", error);
        }
      },
      syncToFirestore: async () => {
        const { uid, settings } = get();
        if (!uid) return;
        try {
          await setDoc(doc(db, 'users', uid), settings, { merge: true });
        } catch (error) {
          console.error("Error syncing to Firestore:", error);
        }
      }
    }),
    {
      name: 'user-settings',
    }
  )
);
