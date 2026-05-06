import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSettings {
  openaiKey?: string;
  geminiKey?: string;
  preferredModel: 'gpt-4o' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  googleLinked: boolean;
}

interface UserStore {
  settings: UserSettings;
  setKeys: (keys: { openaiKey?: string; geminiKey?: string }) => void;
  setPreferredModel: (model: UserSettings['preferredModel']) => void;
  setGoogleLinked: (linked: boolean) => void;
  isConfigured: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      settings: {
        preferredModel: 'gemini-1.5-flash',
        googleLinked: false,
      },
      setKeys: (keys) => set((state) => ({ 
        settings: { ...state.settings, ...keys } 
      })),
      setPreferredModel: (model) => set((state) => ({ 
        settings: { ...state.settings, preferredModel: model } 
      })),
      setGoogleLinked: (linked) => set((state) => ({ 
        settings: { ...state.settings, googleLinked: linked } 
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
