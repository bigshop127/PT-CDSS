import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Brain, 
  Cpu, 
  Folder, 
  Settings, 
  ChevronRight,
  Search,
  History,
  LayoutGrid,
  Library,
  BookOpen,
  Trash2,
  FileCode,
  FileText,
  Link as LinkIcon,
  MoreHorizontal,
  Palette,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLibraryStore, LibraryFolder, LibraryFile } from '@/store/useLibraryStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarSectionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  notebookLmUrl?: string;
  color?: string;
  type?: 'folder' | 'notebook' | 'gem' | 'conversation';
}

export const AppSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { libraryFolders, notebooks, gems, addFolder, addNotebook, addGem, deleteItem, updateItem } = useLibraryStore();

  const [conversations, setConversations] = useState<SidebarSectionItem[]>([
    { id: 'c1', icon: <MessageSquare className="w-4 h-4" />, label: '平台架構 V1', active: true, type: 'conversation' },
    { id: 'c2', icon: <MessageSquare className="w-4 h-4 text-slate-500" />, label: 'Claude CLI 連線問題', type: 'conversation' },
  ]);

  const addItem = (section: string) => {
    if (section === 'notebooks') {
      const name = prompt('筆記本名稱：');
      const url = prompt('NotebookLM 網址：');
      if (name && url) addNotebook(name, url);
    } else if (section === 'gems') {
      const name = prompt('GEM 資源名稱：');
      if (name) addGem(name);
    } else if (section === 'folders') {
      const name = prompt('資料夾名稱：');
      if (name) addFolder(null, name);
    } else if (section === 'conversations') {
      const newItem: SidebarSectionItem = {
        id: Math.random().toString(36).substr(2, 9),
        icon: <MessageSquare className="w-4 h-4 text-slate-500" />,
        label: '新的對話',
        type: 'conversation'
      };
      setConversations([newItem, ...conversations]);
    }
  };

  const handleDelete = (id: string, section: string) => {
    if (section === 'conversations') {
      setConversations(conversations.filter(c => c.id !== id));
    } else {
      deleteItem(id);
    }
  };

  const handleUpdate = (id: string, updates: Partial<SidebarSectionItem>) => {
    if (updates.label) {
      updateItem(id, { name: updates.label });
    } else if (updates.notebookLmUrl) {
      updateItem(id, { url: updates.notebookLmUrl });
    } else if (updates.color) {
      updateItem(id, { color: updates.color });
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-[#0f172a] text-[#e3e3e3] transition-all duration-500 ease-in-out border-r border-slate-800/50 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
        isHovered ? "w-72" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-3">
        <Button 
          onClick={() => addItem('conversations')}
          className={cn(
            "bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300 border border-slate-700/50 rounded-xl h-10 transition-all flex items-center shadow-lg shadow-black/20",
            isHovered ? "w-full px-4 justify-start gap-3" : "w-10 px-0 justify-center"
          )}
        >
          <div className="bg-indigo-500/20 p-1 rounded-lg">
            <Plus className="w-4 h-4 text-indigo-400" />
          </div>
          {isHovered && <span className="text-sm font-bold tracking-tight">新的對話</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 space-y-6 pt-4">
          <Section label="筆記本" isExpanded={isHovered} onAdd={() => addItem('notebooks')}>
            {notebooks.map(item => (
              <SidebarItem 
                key={item.id} 
                item={{ id: item.id, icon: <Brain className="w-4 h-4" />, label: item.name, notebookLmUrl: item.url, color: item.color, type: 'notebook' }} 
                isExpanded={isHovered} 
                onDelete={() => handleDelete(item.id, 'notebooks')} 
                onUpdate={(updates) => handleUpdate(item.id, updates)}
              />
            ))}
          </Section>

          <Section label="GEM 資源 (.md / SKILL)" isExpanded={isHovered} onAdd={() => addItem('gems')}>
            {gems.map(item => (
              <SidebarItem 
                key={item.id} 
                item={{ id: item.id, icon: <FileCode className="w-4 h-4" />, label: item.name, color: item.color, type: 'gem' }} 
                isExpanded={isHovered} 
                onDelete={() => handleDelete(item.id, 'gems')} 
                onUpdate={(updates) => handleUpdate(item.id, updates)}
              />
            ))}
          </Section>

          <Section label="資料夾" isExpanded={isHovered} onAdd={() => addItem('folders')}>
            {libraryFolders.filter(f => !['01','02','03','04','05','06','07','08','root-files'].includes(f.id)).length === 0 ? (
              <div className={cn("px-3 py-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30", !isHovered && "hidden")}>
                <Folder className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">暫無自訂資料夾</p>
              </div>
            ) : (
              libraryFolders.filter(f => !['01','02','03','04','05','06','07','08','root-files'].includes(f.id)).map(item => (
                <SidebarItem 
                  key={item.id} 
                  item={{ id: item.id, icon: <Folder className="w-4 h-4" />, label: item.name, color: item.color || 'text-indigo-400', type: 'folder' }} 
                  isExpanded={isHovered} 
                  onDelete={() => handleDelete(item.id, 'folders')} 
                  onUpdate={(updates) => handleUpdate(item.id, updates)}
                />
              ))
            )}
          </Section>

          <Section label="對話紀錄" isExpanded={isHovered} onAdd={() => addItem('conversations')}>
            {conversations.map(item => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isExpanded={isHovered} 
                onDelete={() => handleDelete(item.id, 'conversations')} 
              />
            ))}
          </Section>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-800/50 bg-slate-900/20">
        <SidebarItem 
          item={{ id: 'settings', icon: <Settings className="w-4 h-4" />, label: '設定與說明' }} 
          isExpanded={isHovered}
        />
      </div>
    </div>
  );
};

const Section = ({ label, children, isExpanded, onAdd }: { label: string, children: React.ReactNode, isExpanded: boolean, onAdd?: () => void }) => (
  <div className="space-y-1.5">
    {isExpanded && (
      <div className="px-3 mb-2 flex items-center justify-between group">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
        <button onClick={onAdd} className="p-1 hover:bg-slate-800 rounded-md transition-colors">
          <Plus className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
        </button>
      </div>
    )}
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ 
  item,
  isExpanded,
  onDelete,
  onUpdate
}: { 
  item: SidebarSectionItem;
  isExpanded: boolean;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<SidebarSectionItem>) => void;
}) => {
  const handleClick = () => {
    if (item.notebookLmUrl) {
      window.open(item.notebookLmUrl, '_blank');
    } else if (item.type === 'gem') {
      alert(`已載入專用技能：${item.label}\nAI 助手現在將遵循此規範進行臨床決策。`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer group relative",
        item.active 
          ? "bg-indigo-500/15 text-indigo-100 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
          : "hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent",
        isExpanded ? "w-full" : "w-10 justify-center mx-auto"
      )}
    >
      <div className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", item.active && "text-indigo-400", item.color)}>
        {item.icon}
      </div>

      {isExpanded && (
        <>
          <span className="text-[12px] font-bold truncate flex-1 tracking-tight">{item.label}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onUpdate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 hover:bg-slate-700 rounded-md transition-all">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48 bg-slate-900 border-slate-800 text-slate-300">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500">項目操作</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => {
                    const newLabel = prompt('重新命名項目：', item.label);
                    if (newLabel) onUpdate({ label: newLabel });
                  }} className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                    <Type className="w-3.5 h-3.5" /> 重新命名
                  </DropdownMenuItem>
                  {item.type === 'notebook' && (
                    <DropdownMenuItem onClick={() => {
                      const newUrl = prompt('輸入 NotebookLM 網址：', item.notebookLmUrl);
                      if (newUrl) onUpdate({ notebookLmUrl: newUrl });
                    }} className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                      <LinkIcon className="w-3.5 h-3.5" /> 設定網址
                    </DropdownMenuItem>
                  )}
                  {item.type === 'folder' && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        const colors = ['text-rose-400', 'text-indigo-400', 'text-emerald-400', 'text-orange-400', 'text-amber-400', 'text-cyan-400', 'text-blue-400', 'text-violet-400'];
                        const currentColorIndex = colors.indexOf(item.color || '');
                        const nextColor = colors[(currentColorIndex + 1) % colors.length];
                        onUpdate({ color: nextColor });
                      }} className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                        <Palette className="w-3.5 h-3.5" /> 更改顏色區分
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        alert('已為此資料夾建立新的關聯對話');
                      }} className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                        <MessageSquare className="w-3.5 h-3.5" /> 加入對話分析
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={onDelete} className="gap-2 text-xs text-rose-400 focus:bg-rose-500/20 focus:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" /> 刪除項目
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!onUpdate && onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-md transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </>
      )}

      {item.active && !isExpanded && (
        <div className="absolute -left-1 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
      )}
    </div>
  );
};
