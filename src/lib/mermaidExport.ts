import { Node, Edge } from "reactflow";

type NodeData = Record<string, unknown>;

const PATH_COLORS: Record<string, { fill: string; stroke: string }> = {
  red:    { fill: "#ffcccc", stroke: "#b85450" },
  orange: { fill: "#ffe6cc", stroke: "#d79b00" },
  blue:   { fill: "#dae8fc", stroke: "#6c8ebf" },
  green:  { fill: "#d5e8d4", stroke: "#82b366" },
  yellow: { fill: "#fff2cc", stroke: "#d6b656" },
  ghost:  { fill: "#f5f5f5", stroke: "#666666" },
  base:   { fill: "#f8f8f8", stroke: "#555555" },
};

function sanitizeId(id: string): string {
  return "N_" + id.replace(/[^a-zA-Z0-9]/g, "_");
}

// Strip HTML styling tags; <br> is allowed for line breaks
function sanitizeLabel(label: string): string {
  return label
    .replace(/<(?!br\s*\/?)[^>]+>/gi, "")
    .replace(/"/g, "'")
    .replace(/[[\]{}|]/g, (c) =>
      ({ "[": "(", "]": ")", "{": "(", "}": ")", "|": "-" }[c] ?? c)
    );
}

// Force parenthetical supplements onto new lines; join multi-line blocks with <br><br>
function formatLabel(raw: string): string {
  const withBreaks = raw.replace(
    /(?<!\n)(（[^）]*）|\([^)]*\))/g,
    "<br>$1"
  );
  return withBreaks.split(/\n+/).filter(Boolean).join("<br><br>");
}

function resolveColors(data: NodeData): { fill: string; stroke: string } {
  if (data?.isRedFlag) return PATH_COLORS.red;
  if (data?.isGhost)   return PATH_COLORS.ghost;
  const c = data?.pathColor as string | undefined;
  return PATH_COLORS[c ?? ""] ?? PATH_COLORS.blue;
}

function nodeShape(data: NodeData): [string, string] {
  if (data?.isDecision) return ["{", "}"];
  if (data?.isCircle)   return ["((", "))"];
  return ["[", "]"];
}

export function nodesToMermaid(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = ["graph TD", ""];

  // ── Node definitions ──
  nodes.forEach((n) => {
    const id = sanitizeId(n.id);
    const raw = sanitizeLabel((n.data?.label as string) || n.id);
    const label = formatLabel(raw);
    const [o, c] = nodeShape(n.data as NodeData);
    lines.push(`  ${id}${o}"${label}"${c}`);
  });

  lines.push("");

  // ── Edge definitions; record indices of safe/no paths ──
  const noPathIndices: number[] = [];
  edges.forEach((e, idx) => {
    const src = sanitizeId(e.source);
    const tgt = sanitizeId(e.target);
    const rawLabel = e.label ? String(e.label) : "";
    const isNoPath =
      (e.data as NodeData)?.isSafePath === true ||
      /否|No|no|安全/.test(rawLabel);
    if (isNoPath) noPathIndices.push(idx);
    const edgeLabel = rawLabel
      ? ` |"${sanitizeLabel(rawLabel)}"| `
      : " ";
    lines.push(`  ${src} -->${edgeLabel}${tgt}`);
  });

  lines.push("");

  // ── Style block (all styles at bottom, R2) ──
  nodes.forEach((n) => {
    const id = sanitizeId(n.id);
    const data = n.data as NodeData;
    const { fill, stroke } = resolveColors(data);
    const dash = data?.isGhost ? "stroke-dasharray:5 5," : "";
    lines.push(
      `  style ${id} fill:${fill},stroke:${stroke},${dash}color:#000,font-size:20px,font-weight:bold`
    );
  });

  lines.push("");

  // ── linkStyle for safe/no paths (R4) ──
  noPathIndices.forEach((idx) => {
    lines.push(`  linkStyle ${idx} stroke:#2196F3,stroke-width:3px`);
  });

  return lines.join("\n");
}
