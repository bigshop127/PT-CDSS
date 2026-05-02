/**
 * Section 3.B: Semantic Compressor.
 * Intercepts high-frequency UI events (like dragging nodes) and 
 * compresses them into a single semantic update for the AI Context.
 */
export class SemanticCompressor {
  private timeout: NodeJS.Timeout | null = null;
  private pendingUpdates: Map<string, { x: number; y: number }> = new Map();

  /**
   * Debounces node movement and prepares a semantic summary.
   * @param nodeId - The ID of the node being moved.
   * @param position - The new position of the node.
   * @param delay - Debounce delay in ms (default 1000ms).
   * @param onCompress - Callback triggered when compression is complete.
   */
  compressDrag(
    nodeId: string, 
    position: { x: number; y: number }, 
    onCompress: (summary: string) => void,
    delay: number = 1000
  ) {
    // Store the latest position for this node
    this.pendingUpdates.set(nodeId, position);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      const summary = this.generateSummary();
      if (summary) {
        onCompress(summary);
      }
      this.pendingUpdates.clear();
      this.timeout = null;
    }, delay);
  }

  private generateSummary(): string {
    if (this.pendingUpdates.size === 0) return "";

    const updates = Array.from(this.pendingUpdates.entries()).map(([id, pos]) => {
      return `Node[${id}] moved to {x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}}`;
    });

    return `[Semantic Update]: User rearranged the canvas. ${updates.join("; ")}.`;
  }
}
