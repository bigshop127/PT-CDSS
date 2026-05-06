import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, MessageCircle, X, Users, Zap, Library, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/components/Workspace';
import { useFlowStore } from '@/store/useFlowStore';
import { useDocumentStore } from '@/store/useDocumentStore';

interface ChatAreaProps {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  semanticHistory: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  chatInput,
  setChatInput,
  onSendMessage,
  isLoading,
  semanticHistory
}) => {
  const nodes = useFlowStore((s) => s.nodes);
  const acceptAllGhostNodes = useFlowStore((s) => s.acceptAllGhostNodes);
  const ghostCount = nodes.filter((n) => n.data?.isGhost).length;
  const { setPendingInsert } = useDocumentStore();

  const handleSend = () => {
    if (!chatInput.trim() || isLoading) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30 w-full relative overflow-hidden">
      {/* 1. Chat Header - Refined Glassmorphism & Orange Accents */}
      <div className="p-4 border-b border-orange-100/50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="font-black text-orange-700 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
            <div className="p-1 rounded-lg bg-orange-100 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            </div>
            Gemini Assistant
          </h2>
          <div className="flex items-center gap-1.5 mt-1 ml-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reasoning Engine Online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50/50 text-[9px] font-black px-2 py-0.5">
            <Zap className="w-2.5 h-2.5 mr-1 fill-orange-500 text-orange-500" />
            TURBO
          </Badge>
        </div>
      </div>

      {/* 2. Messages Area - Improved Spacing & Depth */}
      <ScrollArea className="flex-1 bg-transparent">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 pt-24 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center border border-orange-200/50 shadow-inner">
                <MessageCircle className="w-8 h-8 text-orange-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">PT-CDSS AI 助手</p>
                <p className="text-[10px] text-slate-400 font-bold">輸入臨床問題或指令開始諮詢</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed relative ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm shadow-lg shadow-orange-200/50 font-medium'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Library className="w-3 h-3 text-orange-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">臨床證據引用</p>
                      </div>
                      {msg.citations.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 transition-all hover:bg-orange-50/50 hover:border-orange-100 cursor-pointer group/cite"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-[10px] font-black text-orange-700 truncate flex-1 uppercase tracking-tight">
                              {c.book.replace('.pdf', '')}
                            </p>
                            <Badge variant="outline" className="text-[8px] font-bold bg-white text-slate-400 border-slate-200">P.{c.page}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed italic">
                            "{c.excerpt}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.intent === 'CANVAS_EDIT' && (
                    <button
                      onClick={() => setPendingInsert(msg.content)}
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 group/btn"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform" />
                      插入至 SOAP Plan 區塊
                    </button>
                  )}

                  <div className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-orange-100 text-right' : 'text-slate-300'}`}>
                    {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Accept All Ghost Nodes Button - Enhanced */}
      {ghostCount > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={acceptAllGhostNodes}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 border-none active:scale-95"
          >
            接受臨床建議節點 ({ghostCount})
          </button>
        </div>
      )}

      {/* 3. Input Area - Premium Glassmorphism & Interaction */}
      <div className="p-5 border-t border-slate-200/60 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-500 rounded-[22px] blur opacity-0 group-focus-within:opacity-10 transition duration-1000"></div>
          <div className="relative flex items-center gap-2 bg-slate-50/80 p-1.5 rounded-[18px] border border-slate-200/80 focus-within:bg-white focus-within:border-orange-300 focus-within:shadow-xl transition-all duration-300">
            <Input 
              placeholder="請輸入臨床狀況或詢問治療方針..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 border-none focus-visible:ring-0 shadow-none text-[14px] h-11 bg-transparent placeholder:text-slate-400 placeholder:font-medium"
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={isLoading || !chatInput.trim()}
              className="h-10 w-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-90 group/send"
            >
              <Send className="w-4 h-4 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
          <div className="mt-3 flex justify-between items-center px-2">
             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
               Press Enter to consult
             </div>
             <div className="flex gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-400/30" />
               <div className="w-1.5 h-1.5 rounded-full bg-amber-400/30" />
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/30" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
