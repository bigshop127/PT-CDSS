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
        "flex flex-col h-full bg-[#131314] text-[#e3e3e3] transition-all duration-300 ease-in-out border-r border-[#2d2d2d] z-50",
        isHovered ? "w-72 shadow-2xl" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. New Chat Button */}
      <div className="p-3">
        <Button 
          className={cn(
            "bg-[#1a1a1c] hover:bg-[#2d2d2d] text-slate-300 border border-[#444746] rounded-full h-10 transition-all flex items-center shadow-sm",
            isHovered ? "w-full px-4 justify-start gap-3" : "w-10 px-0 justify-center"
          )}
        >
          <Plus className="w-5 h-5 text-indigo-400" />
          {isHovered && <span className="text-sm font-medium">新的對話</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 space-y-6 pt-2">
          {/* 2. Notebooks */}
          <Section label="筆記本" isExpanded={isHovered}>
            <SidebarItem icon={<Brain className="w-5 h-5 text-rose-400" />} label="大腦袋" isExpanded={isHovered} />
            <SidebarItem icon={<BookOpen className="w-5 h-5 text-orange-400" />} label="Claude 基本功" isExpanded={isHovered} />
            {isHovered && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-[11px] text-slate-500 hover:text-white h-8 pl-9">
                <Plus className="w-3 h-3 mr-2" /> 新增筆記本
              </Button>
            )}
          </Section>

          {/* 3. Gems */}
          <Section label="Gem" isExpanded={isHovered}>
            <SidebarItem icon={<Cpu className="w-5 h-5 text-indigo-400" />} label="問題處理大師" isExpanded={isHovered} />
            <SidebarItem icon={<Library className="w-5 h-5 text-emerald-400" />} label="LTA 整理大師" isExpanded={isHovered} />
          </Section>

          {/* 4. Folders */}
          <Section label="資料夾" isExpanded={isHovered}>
            <div className={cn("px-3 py-4 text-center", !isHovered && "hidden")}>
              <Folder className="w-8 h-8 text-[#444746] mx-auto mb-2" />
              <p className="text-[11px] text-[#444746] font-medium">暫無資料夾</p>
            </div>
          </Section>

          {/* 5. Recent Conversations */}
          <Section label="對話" isExpanded={isHovered}>
            <SidebarItem icon={<MessageSquare className="w-5 h-5 text-sky-400" />} label="平台架構 V1" isExpanded={isHovered} active />
            <SidebarItem icon={<MessageSquare className="w-5 h-5 text-slate-500" />} label="Claude CLI 連線問題" isExpanded={isHovered} />
            <SidebarItem icon={<MessageSquare className="w-5 h-5 text-slate-500" />} label="平台架構 V2" isExpanded={isHovered} />
          </Section>
        </div>
      </ScrollArea>

      {/* Footer Settings */}
      <div className="p-3 border-t border-[#2d2d2d]">
        <SidebarItem 
          icon={<Settings className="w-5 h-5" />} 
          label="設定與說明" 
          isExpanded={isHovered}
        />
      </div>
    </div>
  );
};

const Section = ({ label, children, isExpanded }: { label: string, children: React.ReactNode, isExpanded: boolean }) => (
  <div className="space-y-1">
    {isExpanded && (
      <div className="px-3 mb-2 flex items-center justify-between group">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <Plus className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-pointer" />
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
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group relative",
      active ? "bg-[#2d2e2f] text-white" : "hover:bg-[#2d2d2d] text-[#c4c7c5] hover:text-white",
      isExpanded ? "w-full" : "w-10 justify-center"
    )}
  >
    <div className={cn("shrink-0", active && "text-indigo-400")}>
      {icon}
    </div>
    
    {isExpanded && (
      <span className="text-[13px] font-medium truncate flex-1">{label}</span>
    )}

    {active && !isExpanded && (
      <div className="absolute right-0 w-1 h-5 bg-indigo-500 rounded-l-full" />
    )}
  </div>
);
