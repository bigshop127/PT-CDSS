import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSettings {
  openaiKey?: string;
  geminiKey?: string;
  preferredModel: 'gpt-4o' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-2.0-flash';
  googleLinked: boolean;
  name: string;
  role: string;
}

interface UserStore {
  settings: UserSettings;
  setKeys: (keys: { openaiKey?: string; geminiKey?: string }) => void;
  setProfile: (profile: Partial<UserSettings>) => void;
  isConfigured: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      settings: {
        preferredModel: 'gemini-1.5-flash',
        googleLinked: false,
        name: 'Dr. Chen',
        role: 'Physical Therapist'
      },
      setKeys: (keys) => set((state) => ({ 
        settings: { ...state.settings, ...keys } 
      })),
      setProfile: (profile) => set((state) => ({ 
        settings: { ...state.settings, ...profile } 
      })),
      isConfigured: () => {
        const { settings } = get();
        return !!(settings.openaiKey || settings.geminiKey);
      },
    }),
    {
      name: 'user-settings',
    }
  )
);
