import { useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming Firebase is initialized here
import { useFlowStore } from '@/store/useFlowStore';
import { Node, Edge } from 'reactflow';

/**
 * Section 3.B: Collaboration & Ownership Sync Hook
 * Manages real-time data flow between Firestore and Zustand.
 */
export const useProjectSync = (projectId: string, currentUserId: string) => {
  const { setNodes, setEdges } = useFlowStore();

  /**
   * 1. Real-time Subscription (Section 3.B)
   * Listens to the project document for node/edge updates and ownership changes.
   */
  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, 'projects', projectId);
    
    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      
      // Sync Nodes and Edges to Zustand (Remote -> Local)
      if (data.nodes) setNodes(data.nodes as Node[]);
      if (data.edges) setEdges(data.edges as Edge[]);
      
      // We can also sync ownerId if we add it to the store later
      // useFlowStore.getState().setOwnerId(data.owner_id);
    });

    return () => unsubscribe();
  }, [projectId, setNodes, setEdges]);

  /**
   * 2. Request Control Logic (Section 3.B)
   * Non-owners can request write access by setting a pending request.
   */
  const requestControl = useCallback(async () => {
    const projectRef = doc(db, 'projects', projectId);
    try {
      await updateDoc(projectRef, {
        'control_request': {
          uid: currentUserId,
          timestamp: Date.now(),
          status: 'pending'
        }
      });
    } catch (error) {
      console.error("Failed to request control:", error);
    }
  }, [projectId, currentUserId]);

  /**
   * 3. Approve Control Transfer (Section 3.B)
   * The current Owner approves a request, transferring the owner_id.
   */
  const approveControlTransfer = useCallback(async (requesterUid: string) => {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    
    if (!snap.exists()) return;
    const data = snap.data();

    // Verification: Only the current owner can approve
    if (data.owner_id !== currentUserId) {
      console.error("Unauthorized: Only the current owner can transfer control.");
      return;
    }

    try {
      await updateDoc(projectRef, {
        'owner_id': requesterUid,
        'control_request': null // Clear the request after approval
      });
    } catch (error) {
      console.error("Failed to transfer control:", error);
    }
  }, [projectId, currentUserId]);

  /**
   * 4. Sync Local Changes to Remote (Local -> Remote)
   * Usually debounced to save writes (Section 3.B: Semantic Compressor mindset)
   */
  const syncToRemote = useCallback(async (nodes: Node[], edges: Edge[]) => {
    const projectRef = doc(db, 'projects', projectId);
    try {
      await updateDoc(projectRef, {
        nodes,
        edges,
        last_updated: Date.now()
      });
    } catch (error) {
      console.error("Firestore Update Error:", error);
    }
  }, [projectId]);

  return {
    requestControl,
    approveControlTransfer,
    syncToRemote
  };
};
