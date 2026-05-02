import React from 'react';
import { FileText, Link, Database, CheckCircle2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const SourcePanel = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50 border-r w-full">
      <div className="p-4 border-b bg-white space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          Clinical Sources
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <SourceGroup title="Guidelines">
            <SourceItem label="Cervical CPG 2017" active />
            <SourceItem label="WHO Neck Pain Guidelines" />
          </SourceGroup>
          
          <SourceGroup title="Textbooks">
            <SourceItem label="Magee Orthopedic Assessment" />
            <SourceItem label="Dutton's Orthopaedic" />
          </SourceGroup>

          <SourceGroup title="Web Articles">
            <SourceItem label="Physiopedia - Cervical Myelopathy" />
          </SourceGroup>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-slate-100/50">
        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">Active Context</div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="bg-white border text-[10px] px-1.5 py-0">22 Textbooks</Badge>
          <Badge variant="secondary" className="bg-white border text-[10px] px-1.5 py-0">Active Guideline</Badge>
        </div>
      </div>
    </div>
  );
};

const SourceGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">{title}</div>
    {children}
  </div>
);

const SourceItem = ({ label, active = false }: { label: string; active?: boolean }) => (
  <div className={`
    flex items-center gap-3 px-3 py-3 rounded-md text-sm cursor-pointer transition-colors
    ${active ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-100 shadow-sm' : 'hover:bg-white text-slate-600 border border-transparent'}
  `}>
    {active ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
    <span className="truncate">{label}</span>
  </div>
);

