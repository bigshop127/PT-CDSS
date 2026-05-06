import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from '@tiptap/markdown';
import { Loader2, Download, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useDocumentSave } from '@/hooks/useDocumentSave';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';
import { cn } from '@/lib/utils';

const SOAP_TEMPLATE = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'S — Subjective（主觀描述）' }],
    },
    { type: 'paragraph' },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'O — Objective（客觀評估）' }],
    },
    { type: 'paragraph' },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'A — Assessment（臨床分析）' }],
    },
    { type: 'paragraph' },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'P — Plan（治療計畫）' }],
    },
    { type: 'paragraph' },
  ],
};

type SaveStatus = 'idle' | 'saving' | 'saved';

interface DocumentEditorProps {
  projectId: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ projectId }) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPolishing, setIsPolishing] = useState(false);
  const { pendingInsert, setPendingInsert } = useDocumentStore();
  const { scheduleSave, loadDocument } = useDocumentSave(projectId, setSaveStatus);
  const orchestrator = React.useMemo(
    () => new AIOrchestrator(),
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '在此輸入臨床記錄...' }),
      CharacterCount,
      Markdown,
    ],
    content: SOAP_TEMPLATE,
    onUpdate: ({ editor }) => {
      scheduleSave(editor);
    },
  });

  // 載入既有文件，僅在 editor 就緒後執行一次
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    loadDocument().then((content) => {
      if (!cancelled && content) {
        editor.commands.setContent(content);
      }
    });
    return () => { cancelled = true; };
  }, [editor, loadDocument]);

  // pendingInsert → 插入 Plan 段落後
  useEffect(() => {
    if (!editor || !pendingInsert) return;
    let insertPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'heading' &&
        node.textContent.startsWith('P — Plan')
      ) {
        insertPos = pos + node.nodeSize;
        return false;
      }
    });
    if (insertPos !== null) {
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, [
          { type: 'paragraph', content: [{ type: 'text', text: pendingInsert }] },
        ])
        .run();
    }
    setPendingInsert(null);
  }, [pendingInsert, editor, setPendingInsert]);

  const handlePolish = useCallback(async () => {
    if (!editor || isPolishing) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    setIsPolishing(true);
    try {
      const response = await orchestrator.processRequest(
        `請用物理治療專業術語優化以下文字，保持原意，僅優化表達方式：\n\n${selectedText}`,
        ''
      );
      if (response.message) {
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(response.message)
          .run();
      }
    } catch {
      // preserve original text on error
    } finally {
      setIsPolishing(false);
    }
  }, [editor, orchestrator, isPolishing]);

  const handleExportMarkdown = useCallback(() => {
    if (!editor) return;
    // Tiptap Markdown extension storage provides getMarkdown()
    const md = (editor.storage.markdown as any)?.getMarkdown() || editor.getHTML();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soap_note.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  const saveLabel =
    saveStatus === 'saving'
      ? '儲存中...'
      : saveStatus === 'saved'
      ? `已儲存 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
      : '';

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Toolbar - Refined Glassmorphism */}
      <div className="h-12 border-b border-slate-200/60 flex items-center gap-1 px-4 bg-white/80 backdrop-blur-sm shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mr-3">
          <div className="p-1.5 rounded-lg bg-indigo-50">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            SOAP 臨床記錄
          </span>
        </div>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-xs font-black hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor || isPolishing}
              >
                B
              </Button>
            </TooltipTrigger>
            <TooltipContent>粗體 (⌘B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-xs font-black italic hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor || isPolishing}
              >
                I
              </Button>
            </TooltipTrigger>
            <TooltipContent>斜體 (⌘I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor || isPolishing}
              >
                •—
              </Button>
            </TooltipTrigger>
            <TooltipContent>無序列表</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold gap-1.5 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
            onClick={handleExportMarkdown}
            disabled={!editor || isPolishing}
          >
            <Download className="w-3 h-3 text-slate-500" />
            MARKDOWN
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg border-none transition-all"
            onClick={handleExportPdf}
            disabled={!editor || isPolishing}
          >
            <Download className="w-3 h-3" />
            PDF 匯出
          </Button>
        </div>
      </div>

      {/* Editor Container - Paper Effect */}
      <div className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth">
        <div className="max-w-3xl mx-auto bg-white min-h-[1000px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-200/50 rounded-2xl p-12 mb-10 transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative group">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-tr-2xl pointer-events-none" />
          
          {editor && (
            <BubbleMenu
              editor={editor}
              className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-xl px-2.5 py-1.5 animate-in fade-in zoom-in duration-200"
            >
              <button
                onClick={handlePolish}
                disabled={isPolishing}
                className="flex items-center gap-2 text-xs font-extrabold text-orange-600 hover:text-orange-700 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-all group/btn"
              >
                {isPolishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 group-hover/btn:scale-125 transition-transform" />
                )}
                AI 專業潤色
              </button>
            </BubbleMenu>
          )}
          
          <EditorContent
            editor={editor}
            className="prose prose-slate max-w-none min-h-[400px]
              [&_.ProseMirror]:outline-none
              [&_.ProseMirror_h2]:text-lg
              [&_.ProseMirror_h2]:font-black
              [&_.ProseMirror_h2]:text-indigo-800
              [&_.ProseMirror_h2]:border-l-4
              [&_.ProseMirror_h2]:border-indigo-500
              [&_.ProseMirror_h2]:pl-4
              [&_.ProseMirror_h2]:py-1
              [&_.ProseMirror_h2]:mb-6
              [&_.ProseMirror_h2]:mt-10
              [&_.ProseMirror_h2]:tracking-tight
              [&_.ProseMirror_p]:text-[15px]
              [&_.ProseMirror_p]:leading-relaxed
              [&_.ProseMirror_p]:text-slate-600
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-300
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:font-medium
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
          />
        </div>
      </div>

      {/* Footer - Refined */}
      <div className="h-9 border-t border-slate-200/60 flex items-center justify-between px-5 bg-white shrink-0 z-10 shadow-[0_-1px_5px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {wordCount} WORDS
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            UTF-8
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
          <span
            className={cn(
              'text-[10px] font-black uppercase tracking-wider',
              saveStatus === 'saving' ? 'text-orange-500' : 'text-emerald-600'
            )}
          >
            {saveLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

