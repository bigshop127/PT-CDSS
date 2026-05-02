import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, MessageCircle, X, Users } from 'lucide-react';
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
  const [showFriendChat, setShowFriendChat] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white w-full relative">
      {/* 1. Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-white z-10">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          Clinical AI Assistant
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-[10px] text-slate-400 font-mono">
            Semantic Buffer: {semanticHistory.length > 0 ? "Active" : "Idle"}
          </div>
          
          {/* Friend Chat Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFriendChat(!showFriendChat)}
            className={`flex items-center gap-2 h-8 px-3 rounded-full border transition-all ${
              showFriendChat ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Friend Chat</span>
            <Badge className="bg-indigo-500 h-4 px-1 text-[8px]">2</Badge>
          </Button>
        </div>
      </div>

      {/* Friend Chat Independent Box (Floating Overlay) */}
      {showFriendChat && (
        <div className="absolute top-16 right-4 w-80 h-[450px] bg-white shadow-2xl rounded-xl border border-slate-200 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Collaboration (Friends)</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFriendChat(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <FriendMessage name="Alex" content="Hey, did you see the Magee 2014 citation?" time="10:05 AM" />
              <FriendMessage name="Sarah" content="Yes! Just updated the flowchart." time="10:08 AM" />
              <FriendMessage name="Me" content="Great, I am checking the Spurling test logic now." time="10:10 AM" isMe />
              <div className="text-[10px] text-center text-slate-400 py-2 font-medium uppercase tracking-widest">--- Live Chat ---</div>
            </div>
          </ScrollArea>
          <div className="p-3 border-t bg-white rounded-b-xl">
            <div className="flex gap-2">
              <Input placeholder="Type message to friends..." className="h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-indigo-500" />
              <Button size="icon" className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 shrink-0">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Messages Area (Constrained Width) */}
      <ScrollArea className="flex-1 p-6 bg-slate-50/20">
        <div className="max-w-xl mx-auto space-y-10 py-10">
          <ChatMessage 
            role="assistant" 
            content="System initialized. Clinical guidelines analyzed. State your required flowchart modifications." 
          />
          {isLoading && (
            <div className="flex gap-4 items-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 3. Input Area (Constrained Width) */}
      <div className="p-6 border-t bg-white">
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
          <div className="relative flex gap-2 bg-white p-2 rounded-xl border shadow-sm border-slate-200">
            <Input 
              placeholder="Ask AI to modify canvas or query knowledge..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
              className="flex-1 border-none focus-visible:ring-0 shadow-none text-base h-12"
            />
            <Button 
              size="icon" 
              onClick={onSendMessage} 
              disabled={isLoading || !chatInput.trim()}
              className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-400">
            AI-driven clinical decision support based on 22 core textbooks and CPGs.
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ role, content }: { role: 'user' | 'assistant'; content: string }) => (
  <div className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
      role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
    }`}>
      {role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
    </div>
    <div className="flex-1 space-y-1.5">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {role === 'assistant' ? 'AI Clinical Assistant' : 'You'}
      </div>
      <div className="text-slate-800 leading-relaxed text-[15px] font-medium">
        {content}
      </div>
    </div>
  </div>
);

const FriendMessage = ({ name, content, time, isMe = false }: { name: string; content: string; time: string; isMe?: boolean }) => (
  <div className={cn("flex flex-col gap-1 w-full", isMe ? "items-end" : "items-start")}>
    <div className="flex items-center gap-2 px-1">
      <span className="text-[10px] font-bold text-slate-500">{name}</span>
      <span className="text-[9px] text-slate-400">{time}</span>
    </div>
    <div className={cn(
      "max-w-[85%] p-2.5 rounded-2xl text-[12px] shadow-sm border",
      isMe 
        ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none" 
        : "bg-slate-100 text-slate-700 border-slate-200 rounded-tl-none"
    )}>
      {content}
    </div>
  </div>
);
