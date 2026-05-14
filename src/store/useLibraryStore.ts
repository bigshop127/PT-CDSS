import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LibraryFile {
  id: string;
  name: string;
  type: 'file' | 'link' | 'pdf';
  url?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  color?: string;
  children: (LibraryFolder | LibraryFile)[];
}

interface LibraryStore {
  libraryFolders: LibraryFolder[];
  addFolder: (parentId: string | null, name: string) => void;
  deleteItem: (id: string) => void;
  updateFolder: (id: string, updates: Partial<LibraryFolder>) => void;
}

const INITIAL_LIBRARY: LibraryFolder[] = [
  {
    id: '01',
    name: '臨床邏輯與生存工具箱',
    color: 'bg-rose-500',
    children: [
      {
        id: '01-1',
        name: '疼痛科學與心理衛教 (Pain Science & Education)',
        children: [
          {
            id: '01-1-1',
            name: 'Explain Pain',
            children: [
              { id: '01-1-1-1', name: 'Explain Pain 完整版.pdf', type: 'pdf', url: 'https://drive.google.com/file/d/1_dummy_pdf_link/view' }
            ]
          },
          { id: '01-1-2', name: 'Motivational Interviewing', children: [] }
        ]
      },
      { id: '01-2', name: '鑑別診斷與安全篩查 (Screening & Safety)', children: [] },
      { id: '01-3', name: 'Assessment and Treatment of Muscle Imbalance', children: [] },
    ]
  },
  {
    id: '02',
    name: '動作分析與功能診斷',
    color: 'bg-orange-500',
    children: [
      { id: '02-1', name: '步態分析基礎', children: [] },
      { id: '02-2', name: '功能性動作評估 (FMS)', children: [] },
    ]
  },
  {
    id: '03',
    name: '臨床樞樑技術',
    color: 'bg-amber-500',
    children: []
  },
  {
    id: '04',
    name: '徒手治療系統',
    color: 'bg-emerald-500',
    children: []
  },
  {
    id: '05',
    name: '神經物理治療',
    color: 'bg-cyan-500',
    children: []
  },
  {
    id: '06',
    name: '運動生理與訓練',
    color: 'bg-blue-500',
    children: []
  },
  {
    id: '07',
    name: '小兒物理治療',
    color: 'bg-indigo-500',
    children: []
  },
  {
    id: '08',
    name: '專科與術後復健',
    color: 'bg-violet-500',
    children: []
  }
];

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      libraryFolders: INITIAL_LIBRARY,
      addFolder: (parentId, name) => set((state) => {
        const newFolder: LibraryFolder = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          children: []
        };
        if (!parentId) return { libraryFolders: [...state.libraryFolders, newFolder] };
        
        const updateRecursive = (folders: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return folders.map(item => {
            if ('children' in item && item.id === parentId) {
              return { ...item, children: [...item.children, newFolder] };
            }
            if ('children' in item) {
              return { ...item, children: updateRecursive(item.children) };
            }
            return item;
          });
        };
        return { libraryFolders: updateRecursive(state.libraryFolders) as LibraryFolder[] };
      }),
      deleteItem: (id) => set((state) => {
        const deleteRecursive = (folders: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return folders.filter(item => item.id !== id).map(item => {
            if ('children' in item) {
              return { ...item, children: deleteRecursive(item.children) };
            }
            return item;
          });
        };
        return { libraryFolders: deleteRecursive(state.libraryFolders) as LibraryFolder[] };
      }),
      updateFolder: (id, updates) => set((state) => {
        const updateRecursive = (folders: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return folders.map(item => {
            if (item.id === id) {
              return { ...item, ...updates };
            }
            if ('children' in item) {
              return { ...item, children: updateRecursive(item.children) };
            }
            return item;
          });
        };
        return { libraryFolders: updateRecursive(state.libraryFolders) as LibraryFolder[] };
      }),
    }),
    {
      name: 'library-store',
    }
  )
);
