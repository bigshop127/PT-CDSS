import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * Section 3.B: Red Flag Node implementation.
 * Features a red border and pulse animation if not addressed.
 */
const RedFlagNode = ({ data }: NodeProps) => {
  const isAddressed = data.isAddressed;

  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-white border-2 transition-all",
      isAddressed 
        ? "border-green-500" 
        : "border-red-500 animate-pulse ring-2 ring-red-200"
    )}>
      <Handle type="target" position={Position.Top} className="w-16 !bg-slate-400" />
      
      <div className="flex items-center">
        {!isAddressed && <AlertCircle className="w-5 h-5 text-red-500 mr-2" />}
        <div className="ml-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            [Red Flag]
          </div>
          <div className="text-sm font-bold text-slate-900">{data.label}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-16 !bg-slate-400" />
    </div>
  );
};

export default memo(RedFlagNode);
