import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, MessageCircle, X, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/components/Workspace';

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
  const handleSend = () => {
    if (!chatInput.trim() || isLoading) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

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
      <ScrollArea className="flex-1 p-0 bg-gradient-to-b from-orange-50/10 to-transparent">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60 pt-20">
              <p className="text-sm font-medium text-slate-500">PT-CDSS AI 助手</p>
              <p className="text-xs text-slate-400 mt-1">輸入問題開始諮詢</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-orange-100' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 border-none focus-visible:ring-0 shadow-none text-[15px] h-11 bg-transparent"
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
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
