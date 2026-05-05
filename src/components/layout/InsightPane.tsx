import React from "react";
import { GitBranch, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFlowStore } from "@/store/useFlowStore";
import { nodesToMermaid } from "@/lib/mermaidExport";

export const InsightPane = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const ghostCount = nodes.filter((n) => n.data?.isGhost).length;
  const redFlagCount = nodes.filter(
    (n) => n.data?.isRedFlag && !n.data?.isAddressed
  ).length;

  const handleExport = () => {
    const mmd = nodesToMermaid(nodes, edges);
    const blob = new Blob([mmd], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PT-CDSS.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] text-slate-300 border-l border-[#1f2937]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f2937] bg-[#161b22]/50 flex items-center justify-between">
        <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Mindmap Generation
        </h3>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[9px]"
          >
            V-ALPHA
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

      {/* Mindmap Canvas — concentric circles with live stats */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <line x1="10%" y1="20%" x2="40%" y2="50%" stroke="currentColor" strokeWidth="1" />
          <line x1="40%" y1="50%" x2="70%" y2="30%" stroke="currentColor" strokeWidth="1" />
          <line x1="40%" y1="50%" x2="60%" y2="80%" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="z-10 text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-56 h-56 rounded-full bg-indigo-500/5 border border-indigo-500/20 animate-[pulse_4s_infinite] flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-300">{nodes.length}</div>
                    <div className="text-[9px] text-slate-500">節點</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-purple-500" />
          </div>

          <div className="text-[12px] text-slate-500 space-y-1">
            <div className="text-sm text-slate-400">臨床決策圖譜</div>
          </div>
        </div>
      </div>

      {/* Stats + Export */}
      <div className="p-4 border-t border-[#1f2937] bg-[#0d1117] space-y-3">
        <div className="text-xs text-slate-400 space-y-1 px-1">
          <div className="flex justify-between">
            <span>邊數</span>
            <span className="text-slate-300">{edges.length}</span>
          </div>
          <div className="flex justify-between">
            <span>待確認 Ghost</span>
            <span className={ghostCount > 0 ? "text-indigo-400" : "text-slate-300"}>
              {ghostCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>未處理紅旗</span>
            <span className={redFlagCount > 0 ? "text-rose-400" : "text-slate-300"}>
              {redFlagCount}
            </span>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={nodes.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          size="sm"
        >
          <Download className="w-4 h-4" />
          匯出 Mermaid 流程圖
        </Button>
      </div>
    </div>
  );
};
