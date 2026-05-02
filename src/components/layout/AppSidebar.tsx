import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Book, 
  Folder, 
  Cloud, 
  Settings, 
  ChevronRight, 
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2,
  FileText,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Chapter {
  id: string;
  name: string;
  status: string;
}

export const AppSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();
        setChapters(statusData.chapters || []);
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-slate-900 text-slate-400 transition-all duration-300 ease-in-out border-r border-slate-800 z-50",
        isHovered ? "w-72 shadow-2xl" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Header (PT Logo) */}
      <div className="p-3 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-base">PT</span>
          </div>
          {isHovered && (
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-tight text-base leading-none">PT-CDSS</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Voyager v2</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 space-y-6">
          {/* 2. Active Projects */}
          <Section label="Active Projects" isExpanded={isHovered}>
            <SidebarItem 
              icon={<Folder className="w-5 h-5 text-amber-400" />} 
              label="Cervical Path Project" 
              sublabel="In progress (50%)"
              isExpanded={isHovered}
              active
            />
          </Section>

          {/* 3. NotebookLM Links */}
          <Section label="Knowledge Base" isExpanded={isHovered}>
            <SidebarItem 
              icon={<ExternalLink className="w-5 h-5 text-sky-400" />} 
              label="NotebookLM Hub" 
              sublabel="https://notebooklm.google.com/..."
              isExpanded={isHovered}
              onClick={() => window.open('https://notebooklm.google.com/notebook/5382032a-771d-47f5-a3b9-2254ff629e57', '_blank')}
            />
          </Section>

          {/* 4. Past Conversations */}
          <Section label="Memory" isExpanded={isHovered}>
            <SidebarItem 
              icon={<History className="w-5 h-5 text-emerald-400" />} 
              label="Past Discussions" 
              isExpanded={isHovered}
            />
          </Section>

          {/* 5. Trash */}
          <Section label="System" isExpanded={isHovered}>
            <SidebarItem 
              icon={<Trash2 className="w-5 h-5 text-slate-500 hover:text-rose-400 transition-colors" />} 
              label="Trash" 
              isExpanded={isHovered}
            />
          </Section>
        </div>
      </ScrollArea>

      {/* Footer Settings */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <SidebarItem 
          icon={<Settings className="w-5 h-5" />} 
          label="Preferences" 
          isExpanded={isHovered}
        />
      </div>
    </div>
  );
};

const Section = ({ label, children, isExpanded }: { label: string, children: React.ReactNode, isExpanded: boolean }) => (
  <div className="space-y-1">
    {isExpanded && (
      <div className="px-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</span>
      </div>
    )}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ 
  icon, 
  label, 
  sublabel,
  active = false, 
  isExpanded,
  onClick,
  className
}: { 
  icon: React.ReactNode; 
  label: string; 
  sublabel?: string;
  active?: boolean;
  isExpanded: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative",
      active ? "bg-indigo-600/10 text-white" : "hover:bg-slate-800 text-slate-500 hover:text-slate-200",
      isExpanded ? "w-full" : "w-10 justify-center",
      className
    )}
  >
    <div className={cn("shrink-0", active && "text-indigo-400")}>
      {icon}
    </div>
    
    {isExpanded && (
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-semibold truncate leading-tight">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-500 truncate mt-0.5">{sublabel}</span>}
      </div>
    )}

    {active && !isExpanded && (
      <div className="absolute right-0 w-1 h-6 bg-indigo-500 rounded-l-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
    )}
  </div>
);


