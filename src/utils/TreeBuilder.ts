import { Node, Edge } from 'reactflow';

/**
 * Extended Node type to support nested children for tree structures.
 */
export interface TreeNode extends Node {
  children: TreeNode[];
}

export class TreeBuilder {
  /**
   * Section 3.D: Transforms flat React Flow nodes and edges into a nested tree structure.
   * Uses Depth-First Search (DFS) to resolve parent-child relationships.
   * 
   * @param nodes - The flat array of nodes from React Flow state.
   * @param edges - The flat array of edges from React Flow state.
   * @returns An array of root TreeNodes (nodes with no incoming edges).
   */
  static build(nodes: Node[], edges: Edge[]): TreeNode[] {
    // 1. Map for efficient lookup of target nodes by their source ID
    const childrenMap = new Map<string, string[]>();
    edges.forEach((edge) => {
      const list = childrenMap.get(edge.source) || [];
      list.push(edge.target);
      childrenMap.set(edge.source, list);
    });

    // 2. Identify root nodes (nodes that are NOT targets in any edge)
    const targetNodeIds = new Set(edges.map((edge) => edge.target));
    const rootNodes = nodes.filter((node) => !targetNodeIds.has(node.id));

    // 3. Map nodes by ID for quick access during recursion
    const nodeLookup = new Map<string, Node>(nodes.map((node) => [node.id, node]));

    /**
     * Internal recursive DFS function
     */
    const traverse = (nodeId: string): TreeNode => {
      const node = nodeLookup.get(nodeId);
      
      if (!node) {
        throw new Error(`TreeBuilder Error: Node ID "${nodeId}" referenced in edges but missing in nodes array.`);
      }

      const childIds = childrenMap.get(nodeId) || [];
      const children = childIds.map((id) => traverse(id));

      return {
        ...node,
        children,
      };
    };

    // 4. Build the tree starting from each root
    return rootNodes.map((root) => traverse(root.id));
  }
}
