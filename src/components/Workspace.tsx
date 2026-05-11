import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Panel, Group, Separator } from 'react-resizable-panels';

import { useFlowStore } from '@/store/useFlowStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';

import { FinalizeDialog } from './flow/FinalizeDialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Link as LinkIcon, Cloud, Users, Plus, History as HistoryIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';

// Layout Components
import { AppSidebar } from './layout/AppSidebar';
import { InsightPane } from './layout/InsightPane';
import { ChatArea } from './chat/ChatArea';
import { DocumentEditor } from './document/DocumentEditor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: import('@/services/ai/AIOrchestrator').Citation[];
  intent?: 'CANVAS_EDIT' | 'KNOWLEDGE_QUERY' | 'CHIT_CHAT';
}

const DRIVE_URL = "https://drive.google.com/drive/folders/1OslCCU-8tY3y9p084hWJeO78o7HKIYug";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText, Folder as FolderIcon, ExternalLink } from 'lucide-react';

const DRIVE_ROOT_URL = "https://drive.google.com/drive/u/0/folders/1OslCCU-8tY3y9p084hWJeO78o7HKIYug";

import { useLibraryStore, LibraryFolder, LibraryFile } from '@/store/useLibraryStore';

const NestedLibraryItem = ({ item }: { item: LibraryFolder | LibraryFile }) => {
  const isFolder = 'children' in item;

  if (isFolder) {
    if (item.children.length === 0) {
      return (
        <DropdownMenuItem className="flex items-center gap-3 py-2.5 opacity-50 cursor-not-allowed">
          <FolderIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500 truncate">{item.name} (空)</span>
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-3 py-2.5 cursor-pointer group/item">
          <div className="p-1.5 rounded-lg bg-slate-50 group-hover/item:bg-indigo-50 transition-colors">
            <FolderIcon className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-indigo-600" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 group-hover/item:text-indigo-700 truncate flex-1">{item.name}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-64 p-2 rounded-2xl border-slate-200/60 shadow-2xl backdrop-blur-xl bg-white/95">
            {item.children.map((child) => (
              <NestedLibraryItem key={child.id} item={child} />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenuItem className="flex items-center gap-3 cursor-pointer group/item py-2.5" onClick={() => window.open(item.url || DRIVE_ROOT_URL, '_blank')}>
      <div className="p-1.5 rounded-lg bg-slate-50 group-hover/item:bg-indigo-50 transition-colors">
        {item.type === 'pdf' ? <FileText className="w-3.5 h-3.5 text-rose-500 group-hover/item:text-rose-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-indigo-600" />}
      </div>
      <span className="text-[11px] font-bold text-slate-600 group-hover/item:text-indigo-700 truncate flex-1">{item.name}</span>
      <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-all" />
    </DropdownMenuItem>
  );
};

const WorkspaceContent = ({ projectId, userId }: { projectId: string; userId: string }) => {
  const { libraryFolders } = useLibraryStore();
  const { settings } = useUserStore();
  const { syncToRemote } = useProjectSync(projectId, userId);
  const orchestrator = useMemo(() => new AIOrchestrator(), []);

  const [chatInput, setChatInput] = useState("");
  const [semanticHistory, setSemanticHistory] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Panel Visibility States
  const [showAiChat, setShowAiChat] = useState(true);
  const [showInsight, setShowInsight] = useState(true);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);
    try {
      const response = await orchestrator.processRequest(text, semanticHistory);
      let content: string;
      if (response.intent === 'CANVAS_EDIT') {
        content = '已根據建議更新流程圖，請確認虛線節點。';
      } else if (response.intent === 'KNOWLEDGE_QUERY') {
        content = response.message ?? '已查詢知識庫。';
      } else {
        content = response.message ?? '已處理完成。';
      }
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        citations: response.citations,
        intent: response.intent,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setSemanticHistory(prev => {
        const entry = `[User]: ${text}\n[Assistant]: ${content}`;
        const updated = prev ? `${prev}\n${entry}` : entry;
        return updated.length > 2000 ? updated.slice(-2000) : updated;
      });
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '處理請求時發生錯誤，請重試。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-100 overflow-hidden font-sans flex flex-row">
      <TooltipProvider>
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Global Header with Glassmorphism & Refined Branding */}
          <div className="h-14 border-b border-indigo-100/50 bg-white/80 backdrop-blur-md flex items-center px-4 gap-4 z-20 shadow-[0_1px_10px_rgba(99,102,241,0.05)]">
            <div className="flex items-center gap-3 flex-none group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-4 h-4 text-white fill-white/20" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tighter text-lg">PT-CDSS</span>
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Clinical AI</span>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] px-1 font-bold shadow-sm">PRO</Badge>
            </div>
            
            {/* Search Bar - Refined Interaction */}
            <div className="relative w-72 flex-none group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                placeholder="快速搜尋臨床指引、病歷或文獻..." 
                className="pl-9 bg-slate-100/50 border-transparent h-9 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-white focus-visible:border-indigo-200 text-xs font-medium transition-all duration-300 placeholder:text-slate-400" 
              />
              <div className="absolute right-2 top-2 h-5 px-1.5 rounded border border-slate-200 bg-white text-[9px] font-bold text-slate-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>⌘</span><span>K</span>
              </div>
            </div>

            {/* Book Shortcuts - Dropdown "Google Bookmark" Style */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <div className="w-px h-8 mx-2 bg-slate-200/60" />
              {libraryFolders.map((folder) => (
                <DropdownMenu key={folder.id}>
                  <DropdownMenuTrigger asChild>
                    <button className="group flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white hover:shadow-md hover:border-slate-100 border border-transparent transition-all shrink-0 outline-none">
                      <div className={`w-3.5 h-3.5 rounded-full ${folder.color} shadow-md ring-2 ring-white group-hover:ring-4 group-hover:ring-${folder.color?.split('-')[1]}-100 transition-all`} />
                      <span className="text-[12px] font-black text-slate-700 group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{folder.id} {folder.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-all" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl border-slate-200/60 shadow-2xl backdrop-blur-xl bg-white/95">
                    <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FolderIcon className="w-3.5 h-3.5" />
                      臨床資料夾：{folder.id}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {folder.children.map((item) => (
                      <NestedLibraryItem key={item.id} item={item} />
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center justify-center py-2 text-[10px] font-black text-indigo-600 hover:bg-indigo-50" onClick={() => window.open(DRIVE_ROOT_URL, '_blank')}>
                      開啟 Google 雲端完整目錄
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>

            {/* Panel Toggles - Premium feel */}
            <div className="flex items-center gap-2.5 border-l border-slate-200/60 pl-4 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showAiChat ? "default" : "outline"} 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all duration-500", 
                      showAiChat 
                        ? "bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 shadow-orange-200 shadow-lg border-none" 
                        : "text-orange-500 border-orange-200 bg-orange-50/50 hover:bg-orange-50"
                    )}
                    onClick={() => setShowAiChat(!showAiChat)}
                  >
                    <Sparkles className={cn("w-4 h-4", showAiChat ? "text-white" : "text-orange-500")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-bold">AI 助手對話框</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showInsight ? "default" : "outline"} 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all duration-500", 
                      showInsight 
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-indigo-200 shadow-lg border-none" 
                        : "text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
                    )}
                    onClick={() => setShowInsight(!showInsight)}
                  >
                    <Users className={cn("w-4 h-4", showInsight ? "text-white" : "text-indigo-600")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-bold">團隊協作與心智圖</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4 flex-none justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-4 cursor-pointer group">
                    <div className="hidden sm:flex flex-col items-end mr-1">
                      <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-indigo-600 transition-colors">{settings?.name || 'User'}</span>
                      <div className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> {settings?.role || 'Guest'}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-xs font-black text-indigo-600">
                        {(settings?.name || 'U')[0]}
                      </div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200/60 shadow-2xl backdrop-blur-xl bg-white/95">
                  <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">帳戶設定</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 py-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">{settings?.name || 'User'}</span>
                      <span className="text-[9px] text-slate-400">個人檔案</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 py-2.5">
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-700">加入第二個協作者</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 py-2.5 text-rose-500 focus:text-rose-600">
                    <HistoryIcon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">登出系統</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Group orientation="horizontal" className="flex-1">
            {/* Column 2: Document Editor */}
            <Panel defaultSize={40} minSize={20}>
              <DocumentEditor projectId={projectId} />
            </Panel>

            {showAiChat && (
              <>
                <Separator className="w-px bg-slate-200 hover:bg-orange-400 transition-colors cursor-col-resize" />
                <Panel defaultSize={30} minSize={20}>
                  <ChatArea 
                    messages={messages}
                    chatInput={chatInput} 
                    setChatInput={setChatInput} 
                    onSendMessage={handleSendMessage} 
                    isLoading={isAiLoading} 
                    semanticHistory={semanticHistory} 
                  />
                </Panel>
              </>
            )}

            {showInsight && (
              <>
                <Separator className="w-px bg-slate-200 hover:bg-indigo-400 transition-colors cursor-col-resize" />
                <Panel defaultSize={30} minSize={20}>
                  <InsightPane />
                </Panel>
              </>
            )}
          </Group>
        </div>
      </TooltipProvider>

      <FinalizeDialog />
    </div>
  );
};

export const Workspace = (props: { projectId: string; userId: string }) => (
  <ReactFlowProvider>
    <WorkspaceContent {...props} />
  </ReactFlowProvider>
);
