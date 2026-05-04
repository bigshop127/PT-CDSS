import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { Panel, Group, Separator } from 'react-resizable-panels';

import { useFlowStore } from '@/store/useFlowStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';

import { FinalizeDialog } from './flow/FinalizeDialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Link as LinkIcon, Cloud, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const LIBRARY_FOLDERS = [
  { id: '01', name: '臨床邏輯與生存工具箱', color: 'bg-rose-500' },
  { id: '02', name: '動作分析與功能診斷', color: 'bg-orange-500' },
  { id: '03', name: '臨床樞樑技術', color: 'bg-amber-500' },
  { id: '04', name: '徒手治療系統', color: 'bg-emerald-500' },
  { id: '05', name: '運動介入與穩定系統', color: 'bg-teal-500' },
  { id: '06', name: '神經科學與進階評估', color: 'bg-sky-500' },
  { id: '07', name: '性能表現與進階科學', color: 'bg-indigo-500' },
  { id: '08', name: '專科與術後復健', color: 'bg-purple-500' },
];

const WorkspaceContent = ({ projectId, userId }: { projectId: string; userId: string }) => {
  const { syncToRemote } = useProjectSync(projectId, userId);
  const orchestrator = useMemo(() => new AIOrchestrator(import.meta.env.VITE_GEMINI_API_KEY || ""), []);

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
          {/* Global Header */}
          <div className="h-14 border-b bg-white flex items-center px-4 gap-4 z-10 shadow-sm">
            <div className="flex items-center gap-3 flex-none">
              <span className="font-extrabold text-indigo-700 tracking-tight text-lg">PT-CDSS</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] px-1 font-bold">PRO</Badge>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-64 flex-none">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="快速搜尋..." 
                className="pl-9 bg-slate-100/80 border-none h-9 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm font-medium" 
              />
            </div>

            {/* Book Shortcuts */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <div className="w-px h-6 mx-2 bg-slate-200" />
              {LIBRARY_FOLDERS.map((folder) => (
                <Tooltip key={folder.id}>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => window.open(DRIVE_URL, '_blank')}
                      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all shrink-0 border border-transparent hover:border-slate-200"
                    >
                      <div className={`w-2 h-2 rounded-full ${folder.color} shadow-sm group-hover:scale-125 transition-transform`} />
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{folder.id} {folder.name}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px] font-bold bg-slate-900 text-white">
                    開啟雲端原文：{folder.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Panel Toggles (Floating Icons as per Planning) */}
            <div className="flex items-center gap-2 border-l pl-4 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showAiChat ? "default" : "outline"} 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 rounded-full transition-all duration-300", 
                      showAiChat ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200 shadow-lg" : "text-orange-500 border-orange-200 hover:bg-orange-50"
                    )}
                    onClick={() => setShowAiChat(!showAiChat)}
                  >
                    <Sparkles className={cn("w-4 h-4", showAiChat && "fill-white")} />
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
                      "h-9 w-9 rounded-full transition-all duration-300", 
                      showInsight ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    )}
                    onClick={() => setShowInsight(!showInsight)}
                  >
                    <Users className={cn("w-4 h-4", showInsight && "fill-white")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-bold">團隊協作與心智圖</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4 flex-none justify-end">
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 cursor-pointer hover:bg-slate-50">P</div>
              </div>
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
