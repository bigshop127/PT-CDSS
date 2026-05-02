import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { SourcePanel } from '../document/SourcePanel';
import { ChatArea } from '../chat/ChatArea';

interface MiddlePaneProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  semanticHistory: string;
}

export const MiddlePane: React.FC<MiddlePaneProps> = (props) => {
  return (
    <div className="h-full w-full overflow-hidden">
      <Group orientation="horizontal">
        {/* Source Sidebar (within Middle Pane) */}
        <Panel defaultSize={25} minSize={5} maxSize={40}>
          <SourcePanel />
        </Panel>
        
        <Separator className="w-1.5 bg-slate-50 hover:bg-indigo-100 transition-colors flex items-center justify-center group cursor-col-resize">
          <div className="w-0.5 h-8 bg-slate-200 rounded-full group-hover:bg-indigo-300" />
        </Separator>
        
        {/* Main Chat Area */}
        <Panel defaultSize={75}>
          <ChatArea {...props} />
        </Panel>
      </Group>
    </div>
  );
};
