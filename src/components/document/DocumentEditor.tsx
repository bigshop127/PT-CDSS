import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from '@tiptap/markdown';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Loader2, 
  Download, 
  Sparkles, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Undo2, 
  Redo2, 
  Highlighter,
  MessageSquarePlus,
  X,
  CheckCircle2,
  Reply,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useDocumentSave } from '@/hooks/useDocumentSave';
import { AIOrchestrator } from '@/services/ai/AIOrchestrator';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  selectionRange: { from: number; to: number };
  resolved: boolean;
  replies: { author: string; text: string; timestamp: Date }[];
}

const EMPTY_TEMPLATE = {
  type: 'doc',
  content: [
    { type: 'paragraph' }
  ],
};

type SaveStatus = 'idle' | 'saving' | 'saved';

interface DocumentEditorProps {
  projectId: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ projectId }) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPolishing, setIsPolishing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const { pendingInsert, setPendingInsert } = useDocumentStore();

  const addComment = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    
    const text = prompt('請輸入備註內容：');
    if (!text) return;
    
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: 'Dr. Chen',
      text,
      timestamp: new Date(),
      selectionRange: { from, to },
      resolved: false,
      replies: []
    };
    
    setComments([...comments, newComment]);
    editor.chain().focus().setHighlight({ color: '#fef08a' }).run();
  };

  const handleReply = (commentId: string) => {
    const text = prompt('輸入回覆內容：');
    if (!text) return;
    
    setComments(comments.map(c => 
      c.id === commentId 
        ? { ...c, replies: [...c.replies, { author: 'Dr. Chen', text, timestamp: new Date() }] }
        : c
    ));
  };

  const handleResolve = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const { scheduleSave, loadDocument } = useDocumentSave(projectId, setSaveStatus);
  const orchestrator = React.useMemo(
    () => new AIOrchestrator(),
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '在此開始編寫病歷或點擊 AI 助手生成內容...' }),
      CharacterCount,
      Markdown,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: EMPTY_TEMPLATE,
    onUpdate: ({ editor }) => {
      scheduleSave(editor);
    },
  });

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

  useEffect(() => {
    if (!editor || !pendingInsert) return;
    editor.chain().focus().insertContent(pendingInsert).run();
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
    } finally {
      setIsPolishing(false);
    }
  }, [editor, orchestrator, isPolishing]);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  const saveLabel =
    saveStatus === 'saving'
      ? '同步中'
      : saveStatus === 'saved'
      ? `已同步 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
      : '就緒';

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-slate-100/30 relative overflow-hidden">
      {/* Bubble Menu for quick formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 shadow-xl rounded-xl p-1 animate-in fade-in zoom-in duration-200">
          <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", editor.isActive('bold') && "bg-indigo-50 text-indigo-600")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", editor.isActive('italic') && "bg-indigo-50 text-indigo-600")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", editor.isActive('underline') && "bg-indigo-50 text-indigo-600")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-500" onClick={addComment}>
            <MessageSquarePlus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-indigo-600" onClick={handlePolish}>
            <Sparkles className="w-3.5 h-3.5" />
          </Button>
        </div>
      </BubbleMenu>

      <div className="flex flex-col bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center px-4 h-8 bg-slate-50 gap-4 border-b border-slate-200/50">
          <div className="text-[10px] font-black text-indigo-700 border-b-2 border-indigo-600 h-full flex items-center px-2 cursor-pointer">檔案</div>
          <div className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 h-full flex items-center px-2 cursor-pointer transition-colors">常用</div>
          <div className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 h-full flex items-center px-2 cursor-pointer transition-colors">插入</div>
          <div className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 h-full flex items-center px-2 cursor-pointer transition-colors">佈局</div>
          <div className="flex-1" />
          <div className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", saveStatus === 'saving' ? "bg-orange-400 animate-pulse" : "bg-emerald-500")} />
            {saveLabel}
          </div>
        </div>

        <div className="flex items-stretch h-20 p-1.5 gap-1 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center justify-between border-r border-slate-100 pr-1 mr-1 min-w-[60px]">
            <div className="flex items-center gap-1 mt-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50" onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 className="w-4 h-4 text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50" onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">歷程記錄</span>
          </div>

          <div className="flex flex-col items-center justify-between border-r border-slate-100 px-2 mr-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('bold') && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('italic') && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('underline') && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </Button>
                <div className="w-px h-5 bg-slate-100 mx-1" />
                <input
                  type="color"
                  onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                  value={editor.getAttributes('textStyle').color || '#000000'}
                  className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                  title="文字顏色"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('highlight') && "bg-yellow-200 text-yellow-900")} 
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">字型與顏色</span>
          </div>

          <div className="flex flex-col items-center justify-between border-r border-slate-100 px-2 mr-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive({ textAlign: 'left' }) && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive({ textAlign: 'center' }) && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive({ textAlign: 'right' }) && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </Button>
                <div className="w-px h-5 bg-slate-100 mx-1" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('bulletList') && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('orderedList') && "bg-indigo-100 text-indigo-700")} 
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">段落配置</span>
          </div>

          <div className="flex flex-col items-center justify-between border-r border-slate-100 px-2 mr-1">
            <div className="flex items-center gap-1 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("h-8 px-2 text-[10px] font-black border-slate-200", editor.isActive('heading', { level: 2 }) && "bg-indigo-600 text-white border-none")}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                標題
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("h-8 px-2 text-[10px] font-bold border-slate-200", editor.isActive('paragraph') && "bg-slate-100 text-slate-700")}
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                內文
              </Button>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">快速樣式</span>
          </div>

          <div className="flex flex-col items-center justify-between px-2">
            <div className="flex items-center gap-1.5 mt-0.5">
              <Button
                variant="default"
                size="sm"
                className="h-9 px-3 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-[10px] font-black gap-2 shadow-indigo-200 shadow-md border-none"
                onClick={handleExportPdf}
              >
                <Download className="w-3.5 h-3.5" />
                匯出 PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-[10px] font-black gap-2"
                onClick={addComment}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                新增備註
              </Button>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">發佈與智慧功能</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth bg-slate-100/50 flex flex-row gap-6 justify-center">
        <div className="w-[850px] bg-white min-h-[1100px] shadow-[0_10px_50px_rgba(0,0,0,0.08)] border border-slate-200/60 rounded-sm p-20 relative shrink-0">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
          
          <EditorContent
            editor={editor}
            className="prose prose-slate max-w-none min-h-[800px]
              [&_.ProseMirror]:outline-none
              [&_.ProseMirror_h2]:text-xl
              [&_.ProseMirror_h2]:font-black
              [&_.ProseMirror_h2]:text-slate-900
              [&_.ProseMirror_h2]:mb-6
              [&_.ProseMirror_h2]:mt-10
              [&_.ProseMirror_h2]:tracking-tight
              [&_.ProseMirror_p]:text-[16px]
              [&_.ProseMirror_p]:leading-[1.8]
              [&_.ProseMirror_p]:text-slate-700
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-300
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:font-medium
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
          />
        </div>

        {/* Comments Sidebar */}
        <div className="w-64 flex flex-col gap-4 py-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Highlighter className="w-3.5 h-3.5" />
            臨床備註 ({comments.filter(c => !c.resolved).length})
          </div>
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className={cn(
                "bg-white border border-slate-200 shadow-sm rounded-xl p-4 relative group animate-in slide-in-from-right-4 duration-300",
                comment.resolved && "opacity-50 grayscale"
              )}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleResolve(comment.id)}>
                  <CheckCircle2 className={cn("w-3.5 h-3.5", comment.resolved ? "text-emerald-500" : "text-slate-300")} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-slate-200">
                    <DropdownMenuItem onClick={() => setComments(comments.filter(c => c.id !== comment.id))} className="text-rose-500 text-[11px] font-bold">
                      刪除備註
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                  {comment.author[0]}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-black text-slate-700">{comment.author}</span>
                  <span className="text-[9px] text-slate-400 font-bold">{comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-3">{comment.text}</p>
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                  {comment.replies.map((reply, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 mt-0.5">
                        {reply.author[0]}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-700">{reply.author}</span>
                          <span className="text-[8px] text-slate-400">{reply.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 gap-1.5 mt-2"
                onClick={() => handleReply(comment.id)}
              >
                <Reply className="w-3 h-3" />
                回覆
              </Button>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white/50">
              <MessageSquarePlus className="w-6 h-6 text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">目前暫無備註</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-7 border-t border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 z-10">
        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>{wordCount} 字</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>頁面 1 / 1</span>
        </div>
        <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          PT-CDSS PRO ENGINE
        </div>
      </div>
    </div>
  );
};
