import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LibraryFile {
  id: string;
  name: string;
  type: 'file' | 'link' | 'pdf' | 'notebook' | 'gem';
  url?: string;
  color?: string;
  linkedConversationId?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  color?: string;
  children: (LibraryFolder | LibraryFile)[];
  linkedConversationId?: string;
}

interface LibraryStore {
  libraryFolders: LibraryFolder[];
  notebooks: LibraryFile[];
  gems: LibraryFile[];
  addFolder: (parentId: string | null, name: string) => void;
  addFile: (parentId: string, file: Omit<LibraryFile, 'id'>) => void;
  addNotebook: (name: string, url: string) => void;
  addGem: (name: string) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<LibraryFolder | LibraryFile>) => void;
  linkConversation: (itemId: string, conversationId: string) => void;
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
    children: [
      { id: '03-1', name: '脊椎操作技術', children: [] },
      { id: '03-2', name: '關節鬆動術實務', children: [] },
    ]
  },
  {
    id: '04',
    name: '徒手治療系統',
    color: 'bg-emerald-500',
    children: [
      { id: '04-1', name: '肌筋膜放鬆術', children: [] },
      { id: '04-2', name: '淋巴引流技術', children: [] },
    ]
  },
  {
    id: '05',
    name: '運動介入與穩定系統',
    color: 'bg-cyan-500',
    children: [
      { id: '05-1', name: '核心穩定訓練', children: [] },
      { id: '05-2', name: '動態神經肌肉穩定技術 (DNS)', children: [] },
    ]
  },
  {
    id: '06',
    name: '神經物理治療',
    color: 'bg-blue-500',
    children: [
      { id: '06-1', name: '中風復健指引', children: [] },
      { id: '06-2', name: '帕金森氏症治療', children: [] },
    ]
  },
  {
    id: '07',
    name: '性能表現與進階科學',
    color: 'bg-indigo-500',
    children: [
      { id: '07-1', name: '運動員傷害預防', children: [] },
      { id: '07-2', name: '肌力與體能訓練科學', children: [] },
    ]
  },
  {
    id: '08',
    name: '專科與術後復健',
    color: 'bg-violet-500',
    children: [
      { id: '08-1', name: '前十字韌帶 (ACL) 術後復健', children: [] },
      { id: '08-2', name: '全膝關節置換術 (TKR) 指引', children: [] },
    ]
  },
  {
    id: 'root-files',
    name: '根目錄文件 (雲端直屬)',
    color: 'bg-slate-500',
    children: [
      { id: 'rf1', name: '全部書單.pdf', type: 'pdf', url: 'https://drive.google.com/file/d/1_all_books_pdf/view' },
      { id: 'rf2', name: '書單整理.docx', type: 'file', url: 'https://drive.google.com/file/d/1_book_list_doc/view' },
      { id: 'rf3', name: '代做清單.docx', type: 'file', url: 'https://drive.google.com/file/d/1_todo_list_doc/view' },
      { id: 'rf4', name: 'Claude Code CLI 完整架構指南.md', type: 'file', url: '#' },
    ]
  }
];

const INITIAL_NOTEBOOKS: LibraryFile[] = [
  { id: 'n1', name: '大腦袋', type: 'notebook', url: 'https://notebooklm.google.com/notebook/1', color: 'text-rose-400' },
  { id: 'n2', name: 'Claude 基本功', type: 'notebook', url: 'https://notebooklm.google.com/notebook/2', color: 'text-orange-400' },
];

const INITIAL_GEMS: LibraryFile[] = [
  { id: 'g1', name: 'PT_Clinical_Path.skill', type: 'gem', color: 'text-indigo-400' },
  { id: 'g2', name: 'Architecture_V1.md', type: 'gem', color: 'text-emerald-400' },
];

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      libraryFolders: INITIAL_LIBRARY,
      notebooks: INITIAL_NOTEBOOKS,
      gems: INITIAL_GEMS,
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
      addFile: (parentId, file) => set((state) => {
        const newFile: LibraryFile = {
          ...file,
          id: Math.random().toString(36).substr(2, 9),
        };
        const updateRecursive = (folders: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return folders.map(item => {
            if ('children' in item && item.id === parentId) {
              return { ...item, children: [...item.children, newFile] };
            }
            if ('children' in item) {
              return { ...item, children: updateRecursive(item.children) };
            }
            return item;
          });
        };
        return { libraryFolders: updateRecursive(state.libraryFolders) as LibraryFolder[] };
      }),
      addNotebook: (name, url) => set((state) => ({
        notebooks: [...state.notebooks, { id: Math.random().toString(36).substr(2, 9), name, type: 'notebook', url, color: 'text-slate-400' }]
      })),
      addGem: (name) => set((state) => ({
        gems: [...state.gems, { id: Math.random().toString(36).substr(2, 9), name, type: 'gem', color: 'text-slate-400' }]
      })),
      deleteItem: (id) => set((state) => {
        const deleteRecursive = (folders: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return folders.filter(item => item.id !== id).map(item => {
            if ('children' in item) {
              return { ...item, children: deleteRecursive(item.children) };
            }
            return item;
          });
        };
        return { 
          libraryFolders: deleteRecursive(state.libraryFolders) as LibraryFolder[],
          notebooks: state.notebooks.filter(n => n.id !== id),
          gems: state.gems.filter(g => g.id !== id)
        };
      }),
      updateItem: (id, updates) => set((state) => {
        const updateRecursive = (items: (LibraryFolder | LibraryFile)[]): (LibraryFolder | LibraryFile)[] => {
          return items.map(item => {
            if (item.id === id) {
              return { ...item, ...updates };
            }
            if ('children' in item) {
              return { ...item, children: updateRecursive(item.children) };
            }
            return item;
          });
        };
        return { 
          libraryFolders: updateRecursive(state.libraryFolders) as LibraryFolder[],
          notebooks: state.notebooks.map(n => n.id === id ? { ...n, ...updates } as LibraryFile : n),
          gems: state.gems.map(g => g.id === id ? { ...g, ...updates } as LibraryFile : g)
        };
      }),
      linkConversation: (itemId, conversationId) => {
        get().updateItem(itemId, { linkedConversationId: conversationId });
      }
    }),
    {
      name: 'library-store',
      version: 5,
    }
  )
);
