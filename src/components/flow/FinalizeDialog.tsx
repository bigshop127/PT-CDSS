import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlowStore } from '@/store/useFlowStore';
import { AlertTriangle } from 'lucide-react';

/**
 * Section 3.B: FinalizeDialog implementation.
 * Intercepts finalization to require clinical reasons for red flags.
 */
export const FinalizeDialog = () => {
  const { isFinalizing, pendingRedFlags, confirmFinalize, cancelFinalize } = useFlowStore();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleReasonChange = (id: string, val: string) => {
    setReasons(prev => ({ ...prev, [id]: val }));
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      await confirmFinalize(reasons);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!isFinalizing) return null;

  return (
    <Dialog open={isFinalizing} onOpenChange={(open) => !open && cancelFinalize()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle className="text-xl">臨床定案：紅旗警示核核</DialogTitle>
          </div>
          <DialogDescription>
            系統偵測到下列紅旗節點尚未排除，請輸入排除理由（至少 15 字）以確保臨床溯源。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 py-4">
          <div className="space-y-6">
            {pendingRedFlags.map((node) => (
              <div key={node.id} className="space-y-2 p-3 border rounded-lg bg-slate-50">
                <div className="font-bold text-slate-700">節點：{node.data?.label}</div>
                <Textarea 
                  placeholder="請輸入臨床排除理由 (例如：病患已就醫、經理學檢查排除...)"
                  value={reasons[node.id] || ""}
                  onChange={(e) => handleReasonChange(node.id, e.target.value)}
                  className={reasons[node.id]?.length < 15 ? "border-red-300" : "border-green-300"}
                />
                <div className="text-xs text-right text-slate-400">
                  當前字數: {reasons[node.id]?.length || 0} / 15
                </div>
              </div>
            ))}

            {pendingRedFlags.length === 0 && (
              <div className="py-10 text-center text-slate-500 italic">
                無待處理的紅旗節點，準備好導出圖卡。
              </div>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div className="p-2 mb-4 text-sm bg-red-50 text-red-600 border border-red-200 rounded">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={cancelFinalize}>取消</Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={pendingRedFlags.some(n => (reasons[n.id] || "").length < 15)}
          >
            確認定案並導出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
