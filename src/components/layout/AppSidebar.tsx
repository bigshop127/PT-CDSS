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
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidebarSectionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  notebookLmUrl?: string;
  color?: string;
}

export const AppSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);

  // State for dynamic items
  const [notebooks, setNotebooks] = useState<SidebarSectionItem[]>([
    { id: '1', icon: <Brain className="w-4 h-4 text-rose-400" />, label: '大腦袋', notebookLmUrl: 'https://notebooklm.google.com/notebook/1' },
    { id: '2', icon: <BookOpen className="w-4 h-4 text-orange-400" />, label: 'Claude 基本功', notebookLmUrl: 'https://notebooklm.google.com/notebook/2' },
  ]);

  const [gems, setGems] = useState<SidebarSectionItem[]>([
    { id: '1', icon: <FileCode className="w-4 h-4 text-indigo-400" />, label: 'PT_Clinical_Path.skill' },
    { id: '2', icon: <FileText className="w-4 h-4 text-emerald-400" />, label: 'Architecture_V1.md' },
  ]);

  const [folders, setFolders] = useState<SidebarSectionItem[]>([
    { id: 'f1', icon: <Folder className="w-4 h-4" />, label: '頸椎評估資源', color: 'text-rose-400' },
    { id: 'f2', icon: <Folder className="w-4 h-4" />, label: '腰椎運動處方', color: 'text-indigo-400' },
  ]);

  const [conversations, setConversations] = useState<SidebarSectionItem[]>([
    { id: '1', icon: <MessageSquare className="w-4 h-4" />, label: '平台架構 V1', active: true },
    { id: '2', icon: <MessageSquare className="w-4 h-4 text-slate-500" />, label: 'Claude CLI 連線問題' },
  ]);

  const addItem = (section: string) => {
    const newItem: SidebarSectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      icon: section === 'conversations' ? <MessageSquare className="w-4 h-4 text-slate-500" /> : <Folder className="w-4 h-4" />,
      label: section === 'conversations' ? '新的對話' : '新增資料夾...',
    };

    if (section === 'notebooks') setNotebooks([...notebooks, { ...newItem, icon: <Brain className="w-4 h-4 text-slate-400" />, notebookLmUrl: '#' }]);
    if (section === 'gems') setGems([...gems, { ...newItem, icon: <FileCode className="w-4 h-4 text-slate-400" /> }]);
    if (section === 'folders') setFolders([...folders, { ...newItem, color: 'text-indigo-400' }]);
    if (section === 'conversations') setConversations([newItem, ...conversations]);
  };

  const deleteItem = (id: string, section: string) => {
    if (section === 'notebooks') setNotebooks(notebooks.filter(i => i.id !== id));
    if (section === 'gems') setGems(gems.filter(i => i.id !== id));
    if (section === 'folders') setFolders(folders.filter(i => i.id !== id));
    if (section === 'conversations') setConversations(conversations.filter(i => i.id !== id));
  };

  const updateItem = (id: string, section: string, updates: Partial<SidebarSectionItem>) => {
    const update = (items: SidebarSectionItem[]) => items.map(i => i.id === id ? { ...i, ...updates } : i);
    if (section === 'notebooks') setNotebooks(update(notebooks));
    if (section === 'gems') setGems(update(gems));
    if (section === 'folders') setFolders(update(folders));
    if (section === 'conversations') setConversations(update(conversations));
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
      {/* 1. New Chat Button */}
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
          {/* 2. Notebooks */}
          <Section label="筆記本" isExpanded={isHovered} onAdd={() => addItem('notebooks')}>
            {notebooks.map(item => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isExpanded={isHovered} 
                onDelete={() => deleteItem(item.id, 'notebooks')} 
                onUpdate={(updates) => updateItem(item.id, 'notebooks', updates)}
              />
            ))}
          </Section>

          {/* 3. Gems (Special for .md/SKILL) */}
          <Section label="GEM 資源 (.md / SKILL)" isExpanded={isHovered} onAdd={() => addItem('gems')}>
            {gems.map(item => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isExpanded={isHovered} 
                onDelete={() => deleteItem(item.id, 'gems')} 
                onUpdate={(updates) => updateItem(item.id, 'gems', updates)}
              />
            ))}
          </Section>

          {/* 4. Folders */}
          <Section label="資料夾" isExpanded={isHovered} onAdd={() => addItem('folders')}>
            {folders.length === 0 ? (
              <div className={cn("px-3 py-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30", !isHovered && "hidden")}>
                <Folder className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">暫無資料夾</p>
              </div>
            ) : (
              folders.map(item => (
                <SidebarItem 
                  key={item.id} 
                  item={item} 
                  isExpanded={isHovered} 
                  onDelete={() => deleteItem(item.id, 'folders')} 
                  onUpdate={(updates) => updateItem(item.id, 'folders', updates)}
                />
              ))
            )}
          </Section>

          {/* 5. Recent Conversations */}
          <Section label="對話紀錄" isExpanded={isHovered} onAdd={() => addItem('conversations')}>
            {conversations.map(item => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isExpanded={isHovered} 
                onDelete={() => deleteItem(item.id, 'conversations')} 
                onUpdate={(updates) => updateItem(item.id, 'conversations', updates)}
              />
            ))}
          </Section>
        </div>
      </ScrollArea>

      {/* Footer Settings */}
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Palette, Share2, Type } from 'lucide-react';

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
                  {item.id.startsWith('f') && (
                    <DropdownMenuItem className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                      <Palette className="w-3.5 h-3.5" /> 更改顏色區分
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="gap-2 text-xs focus:bg-indigo-500/20 focus:text-indigo-100">
                    <Share2 className="w-3.5 h-3.5" /> 加入對話分析
                  </DropdownMenuItem>
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

