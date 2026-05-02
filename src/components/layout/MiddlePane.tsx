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
    <div className="h-full w-full overflow-hidden bg-white">
      <Group orientation="horizontal">
        {/* Source Sidebar (within Middle Pane) - Smaller default for more chat space */}
        <Panel defaultSize={20} minSize={10} maxSize={35}>
          <SourcePanel />
        </Panel>
        
        <Separator className="w-1 bg-slate-100 hover:bg-indigo-300 transition-colors flex items-center justify-center cursor-col-resize">
          <div className="w-px h-10 bg-slate-200" />
        </Separator>
        
        {/* Main Chat Area */}
        <Panel defaultSize={80}>
          <ChatArea {...props} />
        </Panel>
      </Group>
    </div>
  );
};
