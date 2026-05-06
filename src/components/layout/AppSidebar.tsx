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
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const AppSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-[#0f172a] text-[#e3e3e3] transition-all duration-500 ease-in-out border-r border-slate-800/50 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
        isHovered ? "w-72" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. New Chat Button - Refined Gradient & Shadow */}
      <div className="p-3">
        <Button 
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
          <Section label="筆記本" isExpanded={isHovered}>
            <SidebarItem icon={<Brain className="w-4 h-4 text-rose-400" />} label="大腦袋" isExpanded={isHovered} />
            <SidebarItem icon={<BookOpen className="w-4 h-4 text-orange-400" />} label="Claude 基本功" isExpanded={isHovered} />
            {isHovered && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] text-slate-500 hover:text-indigo-300 h-8 pl-9 font-bold transition-colors">
                <Plus className="w-3 h-3 mr-2" /> 新增筆記本
              </Button>
            )}
          </Section>

          {/* 3. Gems */}
          <Section label="Gem" isExpanded={isHovered}>
            <SidebarItem icon={<Cpu className="w-4 h-4 text-indigo-400" />} label="問題處理大師" isExpanded={isHovered} />
            <SidebarItem icon={<Library className="w-4 h-4 text-emerald-400" />} label="LTA 整理大師" isExpanded={isHovered} />
          </Section>

          {/* 4. Folders */}
          <Section label="資料夾" isExpanded={isHovered}>
            <div className={cn("px-3 py-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30", !isHovered && "hidden")}>
              <Folder className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">暫無資料夾</p>
            </div>
          </Section>

          {/* 5. Recent Conversations */}
          <Section label="對話紀錄" isExpanded={isHovered}>
            <SidebarItem icon={<MessageSquare className="w-4 h-4" />} label="平台架構 V1" isExpanded={isHovered} active />
            <SidebarItem icon={<MessageSquare className="w-4 h-4 text-slate-500" />} label="Claude CLI 連線問題" isExpanded={isHovered} />
            <SidebarItem icon={<MessageSquare className="w-4 h-4 text-slate-500" />} label="平台架構 V2" isExpanded={isHovered} />
          </Section>
        </div>
      </ScrollArea>

      {/* Footer Settings */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-900/20">
        <SidebarItem 
          icon={<Settings className="w-4 h-4" />} 
          label="設定與說明" 
          isExpanded={isHovered}
        />
      </div>
    </div>
  );
};

const Section = ({ label, children, isExpanded }: { label: string, children: React.ReactNode, isExpanded: boolean }) => (
  <div className="space-y-1.5">
    {isExpanded && (
      <div className="px-3 mb-2 flex items-center justify-between group">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
        <Plus className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
      </div>
    )}
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ 
  icon, 
  label, 
  active = false, 
  isExpanded,
  onClick
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  isExpanded: boolean;
  onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer group relative",
      active 
        ? "bg-indigo-500/15 text-indigo-100 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
        : "hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent",
      isExpanded ? "w-full" : "w-10 justify-center mx-auto"
    )}
  >
    <div className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", active && "text-indigo-400")}>
      {icon}
    </div>
    
    {isExpanded && (
      <span className="text-[12px] font-bold truncate flex-1 tracking-tight">{label}</span>
    )}

    {active && !isExpanded && (
      <div className="absolute -left-1 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
    )}
  </div>
);
