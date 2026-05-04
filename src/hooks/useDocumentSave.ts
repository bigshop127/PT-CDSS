import { useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function useDocumentSave(
  projectId: string,
  setStatus: (s: SaveStatus) => void
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (editor: Editor) => {
      if (timer.current) clearTimeout(timer.current);
      setStatus('saving');
      timer.current = setTimeout(async () => {
        try {
          const content = editor.getJSON();
          await setDoc(
            doc(db, 'projects', projectId, 'documents', 'soap'),
            {
              content,
              updatedAt: new Date(),
            },
            { merge: true }
          );
          setStatus('saved');
        } catch (error) {
          console.error('Failed to save document:', error);
          setStatus('idle');
        }
      }, 1500);
    },
    [projectId, setStatus]
  );

  const loadDocument = useCallback(async (): Promise<object | null> => {
    try {
      const snapshot = await getDoc(
        doc(db, 'projects', projectId, 'documents', 'soap')
      );
      if (snapshot.exists()) {
        const data = snapshot.data();
        return (data.content as object) ?? null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load document:', error);
      return null;
    }
  }, [projectId]);

  return { scheduleSave, loadDocument };
}
