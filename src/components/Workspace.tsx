import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel as FlowPanel,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useFlowStore } from '@/store/useFlowStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';
import { SemanticCompressor } from '@/utils/SemanticCompressor';

import RedFlagNode from './flow/RedFlagNode';
import { FinalizeDialog } from './flow/FinalizeDialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LayoutDashboard, Share2, Search, Link as LinkIcon, Cloud, Bookmark, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Layout Components
import { AppSidebar } from './layout/AppSidebar';
import { SourcePanel } from './document/SourcePanel';
import { InsightPane } from './layout/InsightPane';
import { ChatArea } from './chat/ChatArea';

const nodeTypes = {
  redFlag: RedFlagNode,
};

const DRIVE_URL = "https://drive.google.com/drive/folders/1OslCCU-8tY3y9p084hWJeO78o7HKIYug";

const LIBRARY_FOLDERS = [
  { id: '01', name: '臨床邏輯與生存工具箱', color: 'bg-rose-500' },
  { id: '02', name: '動作分析與功能診斷', color: 'bg-orange-500' },
  { id: '03', name: '臨床樞樑技術', color: 'bg-amber-500' },
  { id: '04', name: '徒手治療系統', color: 'bg-emerald-500' },
  { id: '05', name: '運動介入與穩定系統', color: 'bg-teal-500' },
  { id: '06', name: '神經科學與進階評估', color: 'bg-sky-500' }, // Missing in screen, added as logical 06
  { id: '07', name: '性能表現與進階科學', color: 'bg-indigo-500' },
  { id: '08', name: '專科與術後復健', color: 'bg-purple-500' },
];

const WorkspaceContent = ({ projectId, userId }: { projectId: string; userId: string }) => {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, requestFinalize 
  } = useFlowStore();
  
  const { syncToRemote } = useProjectSync(projectId, userId);
  const orchestrator = useMemo(() => new AIOrchestrator(import.meta.env.VITE_GEMINI_API_KEY || ""), []);
  const compressor = useMemo(() => new SemanticCompressor(), []);

  const [chatInput, setChatInput] = useState("");
  const [semanticHistory, setSemanticHistory] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsAiLoading(true);
    await orchestrator.processRequest(chatInput, semanticHistory);
    setChatInput("");
    setIsAiLoading(false);
  };

  const onNodeDragStop = useCallback((event: any, node: any) => {
    compressor.compressDrag(node.id, node.position, (summary) => {
      setSemanticHistory(prev => `${prev}\n${summary}`);
    });
    syncToRemote(nodes, edges);
  }, [nodes, edges, syncToRemote, compressor]);

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
            
            {/* Search Bar (Moved Left) */}
            <div className="relative w-64 flex-none">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="快速搜尋..." 
                className="pl-9 bg-slate-100/80 border-none h-9 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm font-medium" 
              />
            </div>

            {/* Book Shortcuts (8 Folders) */}
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

            <div className="flex items-center gap-4 flex-none justify-end">
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 cursor-pointer hover:bg-slate-50">P</div>
              </div>
            </div>
          </div>

          <PanelGroup direction="horizontal" className="flex-1">
            <Panel defaultSize={25} minSize={15}>
              <div className="relative h-full w-full bg-blue-50/30 border-r border-blue-100">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeDragStop={onNodeDragStop}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background color="#cbd5e1" gap={20} />
                  <Controls />
                  <FlowPanel position="top-left" className="m-4">
                    <div className="flex gap-2 items-center bg-white/90 p-2.5 rounded-xl shadow-lg border border-blue-100 backdrop-blur-sm">
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      <h1 className="font-bold text-slate-700 text-xs">Clinical Flowchart</h1>
                    </div>
                  </FlowPanel>
                  <FlowPanel position="bottom-right" className="m-4">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-xl text-xs h-9 px-4 rounded-full border-2 border-blue-200" onClick={requestFinalize}>
                      <ShieldAlert className="w-4 h-4 mr-1.5" /> 臨床定案
                    </Button>
                  </FlowPanel>
                </ReactFlow>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-blue-100 hover:bg-blue-400 transition-colors cursor-col-resize z-20" />

            <Panel defaultSize={25} minSize={15}>
              <div className="h-full bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-slate-400" />
                      雲端原文資料夾
                    </h3>
                    <Badge variant="outline" className="text-[9px] border-slate-200">G-Drive</Badge>
                  </div>
                  <div 
                    onClick={() => window.open(DRIVE_URL, '_blank')}
                    className="bg-slate-100 p-2 rounded-lg text-[10px] text-indigo-600 font-mono break-all border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-white transition-colors group"
                  >
                    <LinkIcon className="w-3 h-3 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{DRIVE_URL}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SourcePanel />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors cursor-col-resize z-20" />

            <Panel defaultSize={25} minSize={15}>
              <InsightPane />
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-indigo-500 transition-colors cursor-col-resize z-20" />

            <Panel defaultSize={25} minSize={20}>
              <ChatArea chatInput={chatInput} setChatInput={setChatInput} onSendMessage={handleSendMessage} isLoading={isAiLoading} semanticHistory={semanticHistory} />
            </Panel>
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

