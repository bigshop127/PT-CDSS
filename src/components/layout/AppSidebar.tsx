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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  name: string;
  status: string;
  steps: {
    raw: boolean;
    refined: boolean;
    final: boolean;
  };
}

interface FinanceTask {
  id: string;
  name: string;
  status: string;
  worker: string;
}

export const AppSidebar = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [financeTasks, setFinanceTasks] = useState<FinanceTask[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();
        setChapters(statusData.chapters || []);

        const financeRes = await fetch('/api/finance/status');
        const financeData = await financeRes.json();
        setFinanceTasks(financeData.tasks || []);
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-full border-r border-slate-800">
      {/* 1. Header & New Project */}
      <div className="p-4 space-y-4 bg-slate-800/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">PT</span>
          </div>
          <span className="font-bold text-white tracking-tight text-lg">PT-CDSS</span>
        </div>
        
        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white justify-start gap-3 border-none h-12 text-base">
          <Plus className="w-5 h-5" />
          <span>New Clinical Case</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {/* 2. PT-CDSS Chapters Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PT Clinical Path</span>
            </div>
            {chapters.map((ch) => (
              <SidebarItem 
                key={ch.id}
                icon={getStatusIcon(ch.status)} 
                label={ch.name} 
                active={ch.id === 'cervical'} 
              />
            ))}
          </div>

          {/* 3. Finance Tasks Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Finance Tasks</span>
            </div>
            {financeTasks.map((task) => (
              <SidebarItem 
                key={task.id}
                icon={<Clock className={cn("w-4 h-4", getWorkerColor(task.worker))} />} 
                label={task.name} 
                className="py-2 opacity-80"
              />
            ))}
          </div>

          {/* 4. Folders Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Folders</span>
            </div>
            <SidebarItem icon={<Folder className="w-5 h-5" />} label="Archive" />
          </div>
        </div>
      </ScrollArea>

      {/* 5. Footer */}
      <div className="p-4 border-t border-slate-800">
        <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" />
      </div>
    </div>
  );
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'error_format': return <AlertCircle className="w-5 h-5 text-rose-400" />;
    case 'refining':
    case 'extracting': return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
    default: return <Book className="w-5 h-5 text-slate-500" />;
  }
};

const getWorkerColor = (worker: string) => {
  switch (worker) {
    case 'gemini': return 'text-emerald-400';
    case 'claude': return 'text-sky-400';
    case 'ccb': return 'text-amber-400';
    default: return 'text-slate-400';
  }
};

const SidebarItem = ({ 
  icon, 
  label, 
  active = false, 
  hasChildren = false,
  className
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  hasChildren?: boolean;
  className?: string;
}) => (
  <div className={cn(
    "flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors cursor-pointer group",
    active ? "bg-slate-800 text-white shadow-sm" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200",
    className
  )}>
    {icon}
    <span className="flex-1 truncate font-medium">{label}</span>
    {hasChildren && <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
  </div>
);

