import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from '@tiptap/markdown';
import { Loader2, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col h-full bg-white relative">
      {/* Toolbar */}
      <div className="h-12 border-b flex items-center gap-1 px-4 bg-slate-50 shrink-0">
        <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          SOAP 記錄
        </span>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || isPolishing}
        >
          B
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-bold italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || isPolishing}
        >
          I
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor || isPolishing}
        >
          •—
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleExportMarkdown}
          disabled={!editor || isPolishing}
        >
          <Download className="w-3 h-3" />
          MD
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleExportPdf}
          disabled={!editor || isPolishing}
        >
          <Download className="w-3 h-3" />
          PDF
        </Button>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {editor && (
          <BubbleMenu
            editor={editor}
            className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-2 py-1"
          >
            <button
              onClick={handlePolish}
              disabled={isPolishing}
              className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
            >
              {isPolishing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                '✨'
              )}
              AI 潤色
            </button>
          </BubbleMenu>
        )}
        
        <EditorContent
          editor={editor}
          className="prose prose-slate max-w-none min-h-[400px]
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror_h2]:text-base
            [&_.ProseMirror_h2]:font-extrabold
            [&_.ProseMirror_h2]:text-indigo-700
            [&_.ProseMirror_h2]:border-b
            [&_.ProseMirror_h2]:border-indigo-100
            [&_.ProseMirror_h2]:pb-1
            [&_.ProseMirror_h2]:mb-2
            [&_.ProseMirror_h2]:mt-6
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-300
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>

      {/* Footer */}
      <div className="h-8 border-t flex items-center justify-between px-4 bg-slate-50 shrink-0">
        <span className="text-[10px] text-slate-400 font-medium">
          {wordCount} 字
        </span>
        <span
          className={cn(
            'text-[10px] font-bold',
            saveStatus === 'saving' ? 'text-orange-500' : 'text-emerald-600'
          )}
        >
          {saveLabel}
        </span>
      </div>
    </div>
  );
};

