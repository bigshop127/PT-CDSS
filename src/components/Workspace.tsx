import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel as FlowPanel,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Panel, Group, Separator } from 'react-resizable-panels';

import { useFlowStore } from '@/store/useFlowStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';
import { SemanticCompressor } from '@/utils/SemanticCompressor';

import RedFlagNode from './flow/RedFlagNode';
import { FinalizeDialog } from './flow/FinalizeDialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LayoutDashboard, Share2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// New Layout Components
import { AppSidebar } from './layout/AppSidebar';
import { MiddlePane } from './layout/MiddlePane';

const nodeTypes = {
  redFlag: RedFlagNode,
};

const WorkspaceContent = ({ projectId, userId }: { projectId: string; userId: string }) => {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, requestFinalize 
  } = useFlowStore();
  
  const { requestControl, syncToRemote } = useProjectSync(projectId, userId);
  
  // AI Tools
  const orchestrator = useMemo(() => new AIOrchestrator(import.meta.env.VITE_GEMINI_API_KEY || ""), []);
  const compressor = useMemo(() => new SemanticCompressor(), []);

  // UI State
  const [chatInput, setChatInput] = useState("");
  const [semanticHistory, setSemanticHistory] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Handle AI interaction
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsAiLoading(true);
    await orchestrator.processRequest(chatInput, semanticHistory);
    setChatInput("");
    setIsAiLoading(false);
  };

  // Section 3.B: Semantic Compression of drag events
  const onNodeDragStop = useCallback((event: any, node: any) => {
    compressor.compressDrag(node.id, node.position, (summary) => {
      setSemanticHistory(prev => `${prev}\n${summary}`);
    });
    // Sync to remote after movement
    syncToRemote(nodes, edges);
  }, [nodes, edges, syncToRemote, compressor]);

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden font-sans flex flex-col">
      {/* Global Header with Search (Gemini style top bar) */}
      <div className="h-14 border-b bg-white flex items-center px-4 justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-sm">
              <span className="text-white font-bold text-sm">PT</span>
            </div>
            <span className="font-extrabold text-indigo-700 tracking-tight hidden md:block text-lg">PT-CDSS Platform</span>
          </div>
          
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
            <Input 
              placeholder="Search clinical cases, sources, or guidelines..." 
              className="pl-10 bg-indigo-50/50 border-indigo-100 h-9 focus-visible:ring-2 focus-visible:ring-indigo-500 w-full text-indigo-900 placeholder:text-indigo-300 font-medium" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
            Live Sync
          </Badge>
          <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            P
          </div>
        </div>
      </div>

      {/* 3-Column Resizable Layout */}
      <Group orientation="horizontal" className="flex-1">
        
        {/* Column 1: Gemini-style Sidebar - Reduced default size for better space */}
        <Panel defaultSize={12} minSize={10} maxSize={25}>
          <AppSidebar />
        </Panel>

        <Separator className="w-1 bg-slate-200 hover:bg-indigo-400 transition-colors flex items-center justify-center cursor-col-resize z-20">
          <div className="w-px h-full bg-slate-300" />
        </Separator>

        {/* Column 2: React Flow Canvas (Main Workspace) */}
        <Panel defaultSize={63} minSize={30}>
          <div className="relative h-full w-full bg-white">
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
              <Background color="#f1f5f9" gap={20} />
              <Controls />
              
              {/* Top Panel: Status */}
              <FlowPanel position="top-left" className="flex gap-2 items-center bg-white/95 p-2 rounded-lg shadow-md border border-slate-200 backdrop-blur m-4">
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <h1 className="font-bold text-slate-700 text-xs mr-2">Clinical Flowchart</h1>
              </FlowPanel>

              {/* Action Panel */}
              <FlowPanel position="bottom-right" className="m-4">
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-xl text-xs h-10 px-4 rounded-full"
                  onClick={requestFinalize}
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5" />
                  臨床定案
                </Button>
              </FlowPanel>
            </ReactFlow>
          </div>
        </Panel>

        <Separator className="w-1.5 bg-slate-200 hover:bg-indigo-500 transition-colors flex items-center justify-center cursor-col-resize z-20">
          <div className="w-0.5 h-12 bg-slate-400 rounded-full" />
        </Separator>

        {/* Column 3: AI Assistant Pane - Optimized size constraints */}
        <Panel defaultSize={25} minSize={20} maxSize={45}>
          <MiddlePane 
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendMessage={handleSendMessage}
            isLoading={isAiLoading}
            semanticHistory={semanticHistory}
          />
        </Panel>

      </Group>

      {/* Global Dialogs */}
      <FinalizeDialog />
    </div>
  );
};

export const Workspace = (props: { projectId: string; userId: string }) => (
  <ReactFlowProvider>
    <WorkspaceContent {...props} />
  </ReactFlowProvider>
);
