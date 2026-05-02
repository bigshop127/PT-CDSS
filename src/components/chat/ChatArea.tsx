import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, MessageCircle, X, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  semanticHistory: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatInput,
  setChatInput,
  onSendMessage,
  isLoading,
  semanticHistory
}) => {
  return (
    <div className="flex flex-col h-full bg-white w-full relative">
      {/* 1. Chat Header (Orange Theme) */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white z-10">
        <div className="flex flex-col">
          <h2 className="font-extrabold text-orange-700 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-orange-500 text-orange-500" />
            Gemini Clinical Assistant
          </h2>
          <span className="text-[10px] text-orange-600/60 font-bold ml-6">Advanced Reasoning Model</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 text-[9px] font-bold">
            <Zap className="w-2.5 h-2.5 mr-1 fill-orange-500" />
            TURBO
          </Badge>
        </div>
      </div>

      {/* 2. Messages Area */}
      <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-orange-50/20 to-transparent">
        <div className="max-w-xl mx-auto space-y-8 py-4">
          <ChatMessage 
            role="assistant" 
            content="Hello! I am your Gemini Clinical Assistant. I've indexed your cloud folders and the current flowchart state. How can I help you today?" 
          />
          
          <div className="flex items-center gap-4 py-4">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context Synchronized</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {isLoading && (
            <div className="flex gap-4 items-start animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex-shrink-0 flex items-center justify-center">
                <Bot className="w-5 h-5 text-orange-400" />
              </div>
              <div className="space-y-3 flex-1 pt-1">
                <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 3. Input Area (Orange Accents) */}
      <div className="p-5 border-t bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-0 group-focus-within:opacity-15 transition duration-500"></div>
          <div className="relative flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-orange-300 transition-all shadow-sm">
            <Input 
              placeholder="Ask Gemini anything..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
              className="flex-1 border-none focus-visible:ring-0 shadow-none text-[15px] h-11 bg-transparent"
            />
            <Button 
              size="icon" 
              onClick={onSendMessage} 
              disabled={isLoading || !chatInput.trim()}
              className="h-10 w-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 flex justify-between items-center px-1">
             <div className="text-[9px] text-slate-400 font-medium">
               Press Enter to send
             </div>
             <div className="flex gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
               <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ role, content }: { role: 'user' | 'assistant'; content: string }) => (
  <div className="flex gap-4 items-start group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className={cn(
      "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
      role === 'assistant' ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white" : "bg-slate-100 text-slate-600"
    )}>
      {role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
    </div>
    <div className="flex-1 space-y-1.5 pt-1">
      <div className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        role === 'assistant' ? "text-orange-600" : "text-slate-500"
      )}>
        {role === 'assistant' ? 'Gemini AI' : 'You'}
      </div>
      <div className={cn(
        "leading-relaxed text-[15px] font-medium p-4 rounded-2xl",
        role === 'assistant' ? "bg-white border border-slate-100 shadow-sm text-slate-800" : "bg-slate-100 text-slate-700"
      )}>
        {content}
      </div>
    </div>
  </div>
);
