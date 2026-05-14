import React, { useCallback, useMemo } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch, Maximize2, Download, Highlighter, History, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFlowStore } from "@/store/useFlowStore";
import { nodesToMermaid } from "@/lib/mermaidExport";
import { cn } from "@/lib/utils";
import RedFlagNode from "../flow/RedFlagNode";

const nodeTypes = {
  redFlag: RedFlagNode,
};

export const InsightPane = () => {
  const storeNodes = useFlowStore((s) => s.nodes);
  const storeEdges = useFlowStore((s) => s.edges);
  const { setNodes: setStoreNodes, setEdges: setStoreEdges } = useFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync with store when internal state changes
  React.useEffect(() => {
    setStoreNodes(nodes);
  }, [nodes, setStoreNodes]);

  React.useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  // Sync internal state when store changes (e.g. from AI)
  React.useEffect(() => {
    if (storeNodes.length !== nodes.length) {
      setNodes(storeNodes);
    }
  }, [storeNodes, nodes.length, setNodes]);

  React.useEffect(() => {
    if (storeEdges.length !== edges.length) {
      setEdges(storeEdges);
    }
  }, [storeEdges, edges.length, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleExport = () => {
    const mmd = nodesToMermaid(nodes, edges);
    const blob = new Blob([mmd], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PT-CDSS-Mindmap.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addManualNode = () => {
    const label = prompt("輸入新節點名稱：");
    if (!label) return;
    const newNode = {
      id: `manual_${Date.now()}`,
      data: { label },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const ghostCount = nodes.filter((n) => n.data?.isGhost).length;
  const redFlagCount = nodes.filter(
    (n) => n.data?.isRedFlag && !n.data?.isAddressed
  ).length;

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] text-slate-300 border-l border-[#1f2937]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f2937] bg-[#161b22]/50 flex items-center justify-between">
        <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Interactive Mindmap
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] font-bold text-slate-400 hover:text-white gap-1.5"
            onClick={addManualNode}
          >
            <Plus className="w-3.5 h-3.5" />
            手動新增
          </Button>
          <Badge
            variant="outline"
            className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[9px]"
          >
            V-BETA
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-white"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Mindmap Canvas */}
      <div className="flex-1 relative bg-[#0b0c10]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="bg-slate-900 border-slate-800 fill-white" />
          <MiniMap 
            style={{ height: 120, width: 160 }} 
            nodeColor={(n) => n.data?.isRedFlag ? '#f43f5e' : '#6366f1'}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="rounded-xl border border-slate-800 shadow-2xl"
          />
        </ReactFlow>

        {/* Floating Overlay for Stats */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {ghostCount > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300">{ghostCount} 個 AI 建議節點</span>
            </div>
          )}
          {redFlagCount > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Highlighter className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-bold text-rose-400">{redFlagCount} 個未處理紅旗</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats + Export */}
      <div className="p-4 border-t border-[#1f2937] bg-[#0d1117] space-y-3">
        <div className="text-xs text-slate-400 space-y-1 px-1">
          <div className="flex justify-between">
            <span>節點總數</span>
            <span className="text-slate-300">{nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>路徑連接</span>
            <span className="text-slate-300">{edges.length}</span>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={nodes.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 py-5 rounded-xl transition-all shadow-indigo-500/10 shadow-lg"
          size="sm"
        >
          <Download className="w-4 h-4" />
          匯出 Mermaid 臨床路徑
        </Button>
      </div>
    </div>
  );
};
