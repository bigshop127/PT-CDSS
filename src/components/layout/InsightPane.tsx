import React from 'react';
import { Share2, MessageCircle, GitBranch, Maximize2, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const InsightPane = () => {
  return (
    <div className="h-full flex flex-col bg-[#0b0c10] text-slate-300 border-l border-[#1f2937]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f2937] bg-[#161b22]/50 flex items-center justify-between">
        <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Mindmap Generation
        </h3>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[9px]">V-ALPHA</Badge>
           <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white">
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Mindmap Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center">
        {/* Connection Lines (Aesthetic) */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <line x1="10%" y1="20%" x2="40%" y2="50%" stroke="currentColor" strokeWidth="1" />
          <line x1="40%" y1="50%" x2="70%" y2="30%" stroke="currentColor" strokeWidth="1" />
          <line x1="40%" y1="50%" x2="60%" y2="80%" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="z-10 text-center space-y-6">
          <div className="relative">
            <div className="w-56 h-56 rounded-full bg-indigo-500/5 border border-indigo-500/20 animate-[pulse_4s_infinite] flex items-center justify-center">
               <div className="w-40 h-40 rounded-full bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <GitBranch className="w-10 h-10 text-indigo-400" />
                  </div>
               </div>
            </div>
            {/* Orbiting nodes (Aesthetic) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-purple-500" />
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold text-white tracking-tight">AI 正在構建臨床思維導圖...</h4>
            <p className="text-[12px] text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              分析 Cervical CPG 與臨床筆記中的關聯性，生成診斷與治療建議路徑。
            </p>
          </div>

          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 h-9 text-xs font-bold shadow-lg shadow-indigo-500/20">
            手動重新整理導圖
          </Button>
        </div>
      </div>

      {/* Collaboration / Friend Chat Area (Collapsed/Simplified) */}
      <div className="h-48 border-t border-[#1f2937] flex flex-col bg-[#0d1117]">
        <div className="p-3 bg-[#161b22] flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3 h-3" />
            Collaboration Chat
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-600 font-bold">2 Online</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <CollaboratorMsg name="Dr. Alex" content="Magee 2014 citation looks correct here." />
            <CollaboratorMsg name="Sarah (PT)" content="Should we add the Spurling test node?" />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const CollaboratorMsg = ({ name, content }: { name: string; content: string }) => (
  <div className="space-y-0.5">
    <div className="text-[9px] font-bold text-slate-500">{name}</div>
    <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
      {content}
    </div>
  </div>
);
