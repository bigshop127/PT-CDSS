import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  OnConnect, 
  OnEdgesChange, 
  OnNodesChange, 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges 
} from 'reactflow';

/**
 * Interface for the decision log entry as defined in section 3.A
 */
interface DecisionLogEntry {
  nodeId: string;
  nodeLabel: string;
  reason: string;
  timestamp: number;
}

/**
 * State and Actions for the FlowStore
 */
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  isFinalizing: boolean; // Controls the visibility of the shadcn/ui Dialog
  pendingRedFlags: Node[]; // Red flag nodes that haven't been "addressed"
  decisionLogs: DecisionLogEntry[];
  
  // React Flow Standard Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // PT-CDSS Specific Logic
  requestFinalize: () => void;
  confirmFinalize: (reasons: Record<string, string>) => Promise<void>;
  cancelFinalize: () => void;
  acceptAllGhostNodes: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  isFinalizing: false,
  pendingRedFlags: [],
  decisionLogs: [],

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  /**
   * Section 3.B: Red Flag Protection
   * Intercepts the finalization process if any [Red Flag] nodes are detected.
   */
  requestFinalize: () => {
    const { nodes } = get();
    
    // Identify nodes with [Red Flag] tag or property that are unaddressed.
    // In this implementation, we assume red flags have `data.isRedFlag: true`.
    const redFlags = nodes.filter(node => 
      node.data?.isRedFlag === true && !node.data?.isAddressed
    );

    if (redFlags.length > 0) {
      set({ 
        isFinalizing: true, 
        pendingRedFlags: redFlags 
      });
      // The UI should now show a Dialog (shadcn/ui) to collect reasons.
    } else {
      // No red flags, proceed directly or show a standard confirmation
      set({ isFinalizing: true, pendingRedFlags: [] });
    }
  },

  /**
   * Section 3.A: Decision Log & Finalization
   * Confirms finalization and records reasons for red flag exclusions.
   */
  confirmFinalize: async (reasons: Record<string, string>) => {
    const { pendingRedFlags, nodes } = get();
    
    // Validation: Ensure all red flags have a reason of at least 15 characters (Section 3.B)
    const logs: DecisionLogEntry[] = [];
    for (const node of pendingRedFlags) {
      const reason = reasons[node.id] || "";
      if (reason.length < 15) {
        throw new Error(`Node ${node.data?.label || node.id}: 排除理由需至少 15 字。`);
      }
      logs.push({
        nodeId: node.id,
        nodeLabel: node.data?.label || "Unknown Node",
        reason: reason,
        timestamp: Date.now()
      });
    }

    // Update nodes to mark them as addressed
    const updatedNodes = nodes.map(node => {
      if (reasons[node.id]) {
        return { ...node, data: { ...node.data, isAddressed: true } };
      }
      return node;
    });

    // In a real implementation, this would call a Firebase Function (Section 3.D)
    
    set({ 
      nodes: updatedNodes,
      decisionLogs: [...get().decisionLogs, ...logs],
      isFinalizing: false, 
      pendingRedFlags: [] 
    });

    // Here you would trigger the Firebase Callable Function for Export
  },

  cancelFinalize: () => {
    set({ isFinalizing: false, pendingRedFlags: [] });
  },

  acceptAllGhostNodes: () => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.data?.isGhost
        ? { ...node, data: { ...node.data, isGhost: false }, style: { ...node.style, opacity: 1 } }
        : node
    ),
  })),
}));
