# PT-CDSS 監督框架 (Supervisor Framework)

> **角色定義**
> - **使用者**：產品決策者，定義優先順序與驗收條件
> - **Claude (Supervisor)**：架構審查、任務分解、Directive 起草、交付驗收
> - **Gemini CLI (Executor)**：收到 Directive 後執行程式碼修改，不可自行決策範圍

---

## 協作流程 (Collaboration Protocol)

```
使用者提出需求
    ↓
Claude 分析 → 拆解任務 → 起草 Directive
    ↓
使用者確認 Directive 內容
    ↓
Gemini CLI 執行 Directive
    ↓
Claude 審查 diff / 行為 → 通過或退回
    ↓
使用者最終確認 → git push
```

**重要規則：**
- Gemini CLI **只執行**已被 Claude 審查過的 Directive，不可自行擴充範圍
- 每個 Directive 必須包含：目標、涉及檔案、具體步驟、驗收條件
- Gemini 執行後，Claude 對照 diff 逐項確認，若有偏差立即退回修正

---

## Backlog 優先順序

| # | 任務 | 優先級 | 風險 | 狀態 |
|---|------|--------|------|------|
| B1 | 修正 App.tsx 硬編碼測試憑證 | P1 | 低 | ✅ 完成 (673507d) |
| B2 | Chat 訊息歷史狀態（ChatArea 完全沒存訊息）| P1 | 中 | ✅ 完成 (890b6f4) |
| B3 | 新增「接受所有 Ghost Nodes」按鈕 | P2 | 低 | ✅ 完成 (51be610) |
| B4 | 修正 Export 簽名 URL 有效期（目前到 2500 年）| P2 | 低 | ✅ 完成 (de0d988) |
| B5 | 實作 KNOWLEDGE_QUERY 路徑 | P3 | 高 | ✅ 完成 (B5a+B5b) |
| B6 | Gemini API Key 後端代理（Firebase Functions）| P3 | 高 | ✅ 完成 (de0d988 + dc29fa3) |
| B7 | DocumentEditor 實作（Tiptap）| P4 | 中 | ✅ 完成 (f8cba55) |
| B7-FIX | DocumentEditor 載入修復（loadDocument missing）| P1 | 低 | ✅ 完成 (2026-05-04) |
| B5B6-FIX | Cloud Function JSON.parse 安全防護 | P1 | 中 | ✅ 完成 (2026-05-04) |
| B1-SEC | 生產環境 loading 卡住 + console.log 清理 | P2 | 低 | 待執行 |
| B2-SEC | semanticHistory 永遠空值 / SemanticCompressor 未使用 | P2 | 低 | ✅ 完成 (e7195fd) |
| B3-SEC | Ghost node accept 後 borderStyle 未清除 | P3 | 低 | 待執行 |
| B8 | InsightPane Mindmap 真實化 | P4 | 高 | 待執行 |

---

## Directive 模板 (Directive Template)

每次讓 Gemini 執行時，使用以下格式：

```
## DIRECTIVE [編號]: [標題]

**目標**：一句話說明要達成什麼

**涉及檔案**：
- `src/path/to/file.ts`
- `src/path/to/other.ts`

**禁止範圍**（Gemini 不可動）：
- 列出不可修改的邏輯

**步驟**：
1. 精確步驟 1
2. 精確步驟 2

**驗收條件**：
- [ ] 條件 1
- [ ] 條件 2

**安全規則**：
- 紅旗警示邏輯（15字理由）不可移除
- 不可移除 isGhost 相關邏輯
```

---

## DIRECTIVE B1: 修正硬編碼測試憑證

**目標**：將 App.tsx 中的 hardcoded credentials 移至環境變數，並用 `import.meta.env.DEV` 區隔 dev/prod

**涉及檔案**：
- `src/App.tsx`
- `.env.local`（新增）
- `.env.example`（新增）

**禁止範圍**：
- 不可修改 Firebase 初始化邏輯
- 不可改動 Workspace 元件的 props

**步驟**：

1. 在 `src/App.tsx` 找到 hardcoded credentials 區塊：
   ```typescript
   const email = 'test@example.com';
   const password = 'password123';
   ```
   改為：
   ```typescript
   const email = import.meta.env.VITE_DEV_EMAIL || '';
   const password = import.meta.env.VITE_DEV_PASSWORD || '';
   ```

2. 在 auto-login 邏輯外層加 `if (import.meta.env.DEV)` guard：
   ```typescript
   if (import.meta.env.DEV) {
     // auto login logic
   }
   ```

3. 新建 `.env.local`（不進 git）：
   ```
   VITE_DEV_EMAIL=test@example.com
   VITE_DEV_PASSWORD=password123
   ```

4. 新建 `.env.example`（進 git，作範例）：
   ```
   VITE_DEV_EMAIL=your_dev_email@example.com
   VITE_DEV_PASSWORD=your_dev_password
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

5. 確認 `.gitignore` 已包含 `.env.local`

**驗收條件**：
- [ ] `.env.local` 不在 git tracked files 中
- [ ] `import.meta.env.DEV` guard 存在於 auto-login 邏輯外層
- [ ] prod build 不會觸發 auto-login

---

## DIRECTIVE B2: Chat 訊息歷史狀態

**背景**：`ChatArea.tsx` 目前只有 hardcoded welcome message + loading spinner，`handleSendMessage` 呼叫 AI 後完全沒有更新 chat 顯示。

**目標**：讓使用者輸入的訊息和 AI 回覆都顯示在 chat 歷史中

**涉及檔案**：
- `src/components/chat/ChatArea.tsx`
- `src/components/Workspace.tsx`（傳 messages state 下去）

**禁止範圍**：
- 不可修改 `AIOrchestrator` 核心邏輯
- 不可移除 loading skeleton 動畫
- 不可改動 panel 佈局（react-resizable-panels）

**步驟**：

1. 在 `Workspace.tsx` 新增 messages state：
   ```typescript
   interface ChatMessage {
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: Date;
   }
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   ```

2. 修改 `handleSendMessage`，在呼叫 AI 前後更新 messages：
   ```typescript
   const handleSendMessage = async (text: string) => {
     const userMsg: ChatMessage = {
       id: crypto.randomUUID(),
       role: 'user',
       content: text,
       timestamp: new Date(),
     };
     setMessages(prev => [...prev, userMsg]);
     setIsLoading(true);
     try {
       const result = await orchestrator.processRequest(text, /* context */);
       const assistantMsg: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'assistant',
         content: result.message || result.summary || 'Done.',
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, assistantMsg]);
     } catch (e) {
       // error handling
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. 將 `messages` 和 `isLoading` 作為 props 傳入 `ChatArea`

4. 在 `ChatArea.tsx` 新增 messages prop 並渲染：
   ```typescript
   interface ChatAreaProps {
     messages: ChatMessage[];
     isLoading: boolean;
     onSendMessage: (text: string) => void;
   }
   ```
   渲染訊息列表，user 靠右、assistant 靠左，時間顯示在訊息下方

**驗收條件**：
- [ ] 使用者輸入訊息後，訊息即時出現在 chat 歷史
- [ ] AI 回覆出現在 chat 歷史（不是 void）
- [ ] Loading spinner 在 AI 回覆期間顯示
- [ ] 多輪對話可以正常累積顯示

---

## DIRECTIVE B3: Accept All Ghost Nodes 按鈕

**目標**：在 ChatArea 或 canvas toolbar 新增「接受所有建議」按鈕，一鍵將所有 ghost nodes 轉為正式 nodes

**涉及檔案**：
- `src/store/useFlowStore.ts`（新增 acceptAllGhostNodes action）
- `src/components/chat/ChatArea.tsx` 或 `src/components/FlowCanvas.tsx`

**禁止範圍**：
- 不可移除單個節點的 accept/reject 功能
- 不可改動 `isGhost: true` 的資料結構

**步驟**：

1. 在 `useFlowStore.ts` 新增 action：
   ```typescript
   acceptAllGhostNodes: () => set((state) => ({
     nodes: state.nodes.map(node =>
       node.data.isGhost
         ? { ...node, data: { ...node.data, isGhost: false }, style: { opacity: 1, border: undefined } }
         : node
     )
   })),
   ```

2. 在 ChatArea 底部（input 上方）新增按鈕，僅在有 ghost nodes 時顯示：
   ```typescript
   const ghostCount = nodes.filter(n => n.data.isGhost).length;
   {ghostCount > 0 && (
     <button onClick={acceptAllGhostNodes}>
       接受所有建議 ({ghostCount})
     </button>
   )}
   ```

**驗收條件**：
- [ ] 按鈕只在有 ghost nodes 時出現
- [ ] 點擊後所有 ghost nodes 變為正式 nodes（opacity 1，無 dashed border）
- [ ] ghost nodes 為 0 時按鈕消失

---

## DIRECTIVE B4: 修正 Export 簽名 URL 有效期

**目標**：將 Cloud Run export service 的 signed URL 有效期從 2500 年改為 7 天

**涉及檔案**：
- `services/export-service/index.js`

**禁止範圍**：
- 不可修改 Puppeteer 截圖邏輯
- 不可修改 p-limit 並發控制

**步驟**：

1. 找到 signed URL 設定，將 `expires` 改為：
   ```javascript
   expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
   ```

2. 在 response 中加入 `expiresAt` 欄位，讓前端可以顯示過期時間：
   ```javascript
   res.json({
     url: signedUrl,
     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
   });
   ```

**驗收條件**：
- [ ] signed URL 有效期為 7 天（非 2500 年）
- [ ] response 包含 `expiresAt` 欄位

---

## DIRECTIVE B5: 實作 KNOWLEDGE_QUERY 路徑（複雜，需單獨討論）

**背景**：`AIOrchestrator.ts` 中 `KNOWLEDGE_QUERY` 的 `else if` block 完全為空。需要設計 RAG 架構才能實作。

**狀態**：⚠️ 需要 Claude + 使用者先架構討論，再起草 Directive

---

## DIRECTIVE B6: Gemini API Key 後端代理（Firebase Functions V2 Proxy）

**背景**：`Workspace.tsx` 直接把 `VITE_GEMINI_API_KEY` 傳給 `AIOrchestrator`，API Key 會暴露在前端 bundle。架構決策：Intent 分類與 generation 全部移至 Cloud Function；前端改用 Firebase SDK `httpsCallable` 呼叫；Key 存於 Google Cloud Secret Manager。

**目標**：Gemini API Key 完全不出現在前端 bundle；`Workspace.tsx` 零修改；`processRequest` 外部簽名不變。

**涉及檔案**：
- `functions/src/index.ts`（新建）
- `functions/package.json`（新建）
- `functions/tsconfig.json`（新建）
- `src/services/ai/AIOrchestrator.ts`（完整重寫）
- `src/services/ai/IntentRouter.ts`（清空為 types-only，不刪除）

**禁止範圍**：
- 不可修改 `src/components/Workspace.tsx`（任何一行）
- 不可修改 `src/store/useFlowStore.ts` 中的 `confirmFinalize` 15 字驗證
- 不可刪除 `AIOrchestrator.ts` 中的 `applyGhostNodes` 方法
- 不可移除 `isGhost` flag 邏輯

**前置手動步驟（Gemini 執行前，使用者操作）**：

1. 在 Google Cloud Console 啟用 Secret Manager API
2. 建立 secret：
   ```bash
   echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
   ```
3. 授權 Cloud Functions Service Account 存取：
   ```bash
   gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
     --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```
4. 初始化 Firebase Functions（若尚未初始化）：
   ```bash
   cd "C:\gemini CLI\PT-CDSS"
   firebase init functions  # 選 TypeScript
   ```

**步驟**：

1. 新建 `functions/package.json`：
   ```json
   {
     "name": "pt-cdss-functions",
     "scripts": { "build": "tsc", "serve": "npm run build && firebase emulators:start --only functions", "deploy": "firebase deploy --only functions" },
     "main": "lib/index.js",
     "dependencies": {
       "firebase-admin": "^12.0.0",
       "firebase-functions": "^5.0.0",
       "@google/generative-ai": "^0.15.0"
     },
     "devDependencies": { "typescript": "^5.4.0" },
     "engines": { "node": "20" }
   }
   ```

2. 新建 `functions/tsconfig.json`：
   ```json
   {
     "compilerOptions": {
       "module": "commonjs",
       "noImplicitReturns": true,
       "outDir": "lib",
       "sourceMap": true,
       "strict": true,
       "target": "es2017"
     },
     "compileOnSave": true,
     "include": ["src"]
   }
   ```

3. 新建 `functions/src/index.ts`：

   ```typescript
   import { onCall, HttpsError } from "firebase-functions/v2/https";
   import { defineSecret } from "firebase-functions/params";
   import { GoogleGenerativeAI } from "@google/generative-ai";

   const geminiApiKey = defineSecret("GEMINI_API_KEY");

   type Intent = "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";

   interface AIRequestData {
     userInput: string;
     semanticHistory: string;
     nodes: unknown[];
     edges: unknown[];
   }

   interface NodeProposal {
     id: string;
     label: string;
     type?: string;
     position?: { x: number; y: number };
   }

   interface AIResponseData {
     intent: Intent;
     message: string;
     proposals?: NodeProposal[];
   }

   const INTENT_PROMPT = `你是臨床決策支援系統的意圖分類器。
   根據使用者輸入，回傳以下其中一個意圖（僅回傳 JSON）：
   - CANVAS_EDIT：需要修改臨床流程圖
   - KNOWLEDGE_QUERY：詢問臨床知識或指引
   - CHIT_CHAT：一般對話
   格式：{"intent": "INTENT_NAME", "confidence": 0.0-1.0}`;

   const CANVAS_PROMPT = `你是臨床決策支援系統的流程圖助手。
   根據使用者需求與現有節點，以 JSON 格式回傳新增節點提案。
   格式：{"proposals": [{"id": "uuid", "label": "節點名稱", "type": "default"}]}
   重要：所有提案節點預設為 ghost（isGhost: true），由使用者決定是否採用。`;

   export const geminiProxy = onCall<AIRequestData, Promise<AIResponseData>>(
     { secrets: [geminiApiKey], region: "asia-east1", timeoutSeconds: 60 },
     async (request) => {
       if (!request.auth) {
         throw new HttpsError("unauthenticated", "Authentication required.");
       }

       const { userInput, semanticHistory, nodes } = request.data;
       if (!userInput?.trim()) {
         throw new HttpsError("invalid-argument", "userInput is required.");
       }

       const genAI = new GoogleGenerativeAI(geminiApiKey.value());

       // Step 1: Classify intent
       const classifierModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
       const classifyResult = await classifierModel.generateContent(
         `${INTENT_PROMPT}\n\n使用者輸入：${userInput}`
       );
       const classifyText = classifyResult.response.text().trim();

       let intent: Intent = "CHIT_CHAT";
       try {
         const parsed = JSON.parse(classifyText.replace(/```json\n?|\n?```/g, ""));
         intent = parsed.intent as Intent;
       } catch {
         intent = "CHIT_CHAT";
       }

       // Step 2: Dispatch by intent
       if (intent === "CANVAS_EDIT") {
         const canvasModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
         const context = `現有節點數：${nodes.length}。歷史摘要：${semanticHistory || "無"}`;
         const canvasResult = await canvasModel.generateContent(
           `${CANVAS_PROMPT}\n\n${context}\n\n使用者需求：${userInput}`
         );
         const canvasText = canvasResult.response.text().trim();

         try {
           const parsed = JSON.parse(canvasText.replace(/```json\n?|\n?```/g, ""));
           return {
             intent: "CANVAS_EDIT",
             message: `已生成 ${parsed.proposals?.length ?? 0} 個建議節點，請確認是否採用。`,
             proposals: parsed.proposals ?? [],
           };
         } catch {
           return { intent: "CANVAS_EDIT", message: "生成節點時發生解析錯誤，請重試。" };
         }
       }

       if (intent === "KNOWLEDGE_QUERY") {
         // B5 placeholder — will be implemented in DIRECTIVE B5-query
         return {
           intent: "KNOWLEDGE_QUERY",
           message: "知識庫查詢功能正在建置中（B5）。請先使用一般對話或流程圖編輯功能。",
         };
       }

       // CHIT_CHAT fallback
       return { intent: "CHIT_CHAT", message: "已收到您的訊息。如需編輯流程圖或查詢臨床指引，請直接說明需求。" };
     }
   );
   ```

4. 完整重寫 `src/services/ai/AIOrchestrator.ts`：

   ```typescript
   import { getFunctions, httpsCallable } from "firebase/functions";
   import { getApp } from "firebase/app";
   import { useFlowStore } from "@/store/useFlowStore";
   import type { Node } from "reactflow";

   type Intent = "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";

   interface AIRequestData {
     userInput: string;
     semanticHistory: string;
     nodes: Node[];
     edges: unknown[];
   }

   interface NodeProposal {
     id: string;
     label: string;
     type?: string;
     position?: { x: number; y: number };
   }

   export interface AIResponseData {
     intent: Intent;
     message: string;
     proposals?: NodeProposal[];
   }

   export class AIOrchestrator {
     private callGemini: ReturnType<typeof httpsCallable<AIRequestData, AIResponseData>>;

     constructor(_apiKey?: string) {
       // _apiKey intentionally ignored — Workspace.tsx passes env var but key lives in Secret Manager
       const functions = getFunctions(getApp(), "asia-east1");
       this.callGemini = httpsCallable<AIRequestData, AIResponseData>(functions, "geminiProxy");
     }

     async processRequest(userInput: string, semanticHistory: string): Promise<AIResponseData> {
       const store = useFlowStore.getState();
       const result = await this.callGemini({
         userInput,
         semanticHistory,
         nodes: store.nodes,
         edges: store.edges,
       });
       const data = result.data;
       if (data.intent === "CANVAS_EDIT" && data.proposals && data.proposals.length > 0) {
         this.applyGhostNodes(data.proposals);
       }
       return data;
     }

     private applyGhostNodes(proposals: NodeProposal[]): void {
       const store = useFlowStore.getState();
       const baseX = 200;
       const baseY = 200;
       const newNodes: Node[] = proposals.map((p, i) => ({
         id: p.id || crypto.randomUUID(),
         type: p.type || "default",
         position: p.position ?? { x: baseX + i * 180, y: baseY + i * 80 },
         data: {
           label: p.label,
           isGhost: true,
         },
         style: { opacity: 0.5, border: "2px dashed #6366f1" },
       }));
       store.setNodes([...store.nodes, ...newNodes]);
     }
   }
   ```

5. 清空 `src/services/ai/IntentRouter.ts` 為 types-only（保留檔案，避免 import 錯誤）：

   ```typescript
   // Intent classification has moved to Firebase Functions (geminiProxy — B6).
   // This file is retained to avoid breaking any existing imports.
   export type Intent = "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT";
   export interface IntentResponse {
     intent: Intent;
     confidence: number;
     reason?: string;
   }
   ```

6. 在 `functions/` 目錄執行：
   ```bash
   cd functions && npm install
   ```

7. 驗證 TypeScript 無錯誤：
   ```bash
   cd functions && npm run build
   cd .. && npx tsc --noEmit
   ```

**驗收條件**：
- [ ] `VITE_GEMINI_API_KEY` 不再出現在 `AIOrchestrator.ts` runtime 路徑中
- [ ] `Workspace.tsx` 完全未修改（git diff 確認）
- [ ] `processRequest(text, semanticHistory)` 呼叫簽名保持不變
- [ ] `applyGhostNodes` 仍可正確將 ghost nodes 加入 Zustand store
- [ ] `confirmFinalize` 15 字驗證邏輯未被改動
- [ ] `functions/` 目錄 TypeScript build 無錯誤
- [ ] `src/` TypeScript `--noEmit` 無錯誤

**安全規則**：
- `geminiApiKey.value()` 只在 Cloud Function runtime 呼叫，絕不傳至前端
- `request.auth` 檢查不可移除（未認證請求必須 throw `unauthenticated`）
- `isGhost: true` 必須出現在所有 `applyGhostNodes` 產生的節點 data 中

---

## DIRECTIVE B7: DocumentEditor 實作（Tiptap）

**目標**：實作 SOAP 格式的臨床文件編輯器，包含 Firestore 自動儲存（debounce 1500ms）、AI 潤色（BubbleMenu）、從 Chat 插入至 Plan 區塊，以及 Markdown/PDF 匯出功能。

**涉及檔案**：
- `package.json`（新增 Tiptap 依賴）
- `src/store/useDocumentStore.ts`（新建）
- `src/hooks/useDocumentSave.ts`（新建）
- `src/components/document/DocumentEditor.tsx`（完全重寫）
- `src/components/Workspace.tsx`（局部修改：ChatMessage intent 欄位 + assistantMsg intent + DocumentEditor prop）
- `src/components/chat/ChatArea.tsx`（局部修改：useDocumentStore import + 「插入至 Plan」按鈕）

**禁止範圍**（Gemini 不可動）：
- `useFlowStore` 的任何 action（`acceptAllGhostNodes`、`setNodes`、`setEdges`、`confirmFinalize` 等）
- `ChatArea.tsx` 的 citation cards 渲染邏輯
- `ChatArea.tsx` 的「接受所有建議節點」按鈕（`ghostCount > 0` 條件渲染）
- `functions/` 目錄（Cloud Functions 不可修改）
- `AIOrchestrator.ts` 的 `processRequest` 與 `applyGhostNodes` 邏輯
- Firebase Auth / Firestore security rules

**步驟**：

1. 安裝 Tiptap 依賴：
   ```bash
   cd "C:\gemini CLI\PT-CDSS" && npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-markdown
   ```

2. 新建 `src/store/useDocumentStore.ts`：
   ```typescript
   import { create } from 'zustand';
   interface DocumentStore {
     pendingInsert: string | null;
     setPendingInsert: (text: string | null) => void;
   }
   export const useDocumentStore = create<DocumentStore>((set) => ({
     pendingInsert: null,
     setPendingInsert: (text) => set({ pendingInsert: text }),
   }));
   ```

3. 新建 `src/hooks/useDocumentSave.ts`：
   ```typescript
   import { useRef, useCallback } from 'react';
   import { Editor } from '@tiptap/react';
   import { doc, setDoc } from 'firebase/firestore';
   import { db } from '@/lib/firebase';

   type SaveStatus = 'idle' | 'saving' | 'saved';

   export function useDocumentSave(projectId: string, setStatus: (s: SaveStatus) => void) {
     const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
     const scheduleSave = useCallback((editor: Editor) => {
       if (timer.current) clearTimeout(timer.current);
       setStatus('saving');
       timer.current = setTimeout(async () => {
         try {
           const content = editor.getJSON();
           await setDoc(
             doc(db, 'projects', projectId, 'documents', 'soap'),
             { content, updatedAt: new Date() },
             { merge: true }
           );
           setStatus('saved');
         } catch {
           setStatus('idle');
         }
       }, 1500);
     }, [projectId, setStatus]);
     return { scheduleSave };
   }
   ```

4. 完整重寫 `src/components/document/DocumentEditor.tsx`：

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
   import StarterKit from '@tiptap/starter-kit';
   import Placeholder from '@tiptap/extension-placeholder';
   import CharacterCount from '@tiptap/extension-character-count';
   import Markdown from '@tiptap/extension-markdown';
   import { Loader2, Download, Printer, Sparkles } from 'lucide-react';
   import { Button } from '@/components/ui/button';
   import { Badge } from '@/components/ui/badge';
   import { cn } from '@/lib/utils';
   import { useDocumentStore } from '@/store/useDocumentStore';
   import { useDocumentSave } from '@/hooks/useDocumentSave';
   import { AIOrchestrator } from '@/services/ai/AIOrchestrator';

   const SOAP_TEMPLATE = {
     type: 'doc',
     content: [
       { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'S — Subjective（主觀描述）' }] },
       { type: 'paragraph' },
       { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'O — Objective（客觀評估）' }] },
       { type: 'paragraph' },
       { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A — Assessment（臨床分析）' }] },
       { type: 'paragraph' },
       { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'P — Plan（治療計畫）' }] },
       { type: 'paragraph' },
     ],
   };

   type SaveStatus = 'idle' | 'saving' | 'saved';

   export const DocumentEditor: React.FC<{ projectId: string }> = ({ projectId }) => {
     const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
     const [isPolishing, setIsPolishing] = useState(false);
     const { pendingInsert, setPendingInsert } = useDocumentStore();
     const { scheduleSave } = useDocumentSave(projectId, setSaveStatus);
     const orchestrator = React.useMemo(() => new AIOrchestrator(), []);

     const editor = useEditor({
       extensions: [
         StarterKit,
         Placeholder.configure({ placeholder: '在此輸入內容...' }),
         CharacterCount,
         Markdown,
       ],
       content: SOAP_TEMPLATE,
       onUpdate: ({ editor }) => {
         scheduleSave(editor);
       },
     });

     // 從 ChatArea 插入內容至 P — Plan 下方
     useEffect(() => {
       if (!pendingInsert || !editor) return;
       let insertPos: number | null = null;
       editor.state.doc.descendants((node, pos) => {
         if (node.type.name === 'heading' && node.textContent.startsWith('P — Plan')) {
           insertPos = pos + node.nodeSize;
           return false;
         }
       });
       if (insertPos !== null) {
         editor.chain().focus().insertContentAt(insertPos, [
           { type: 'paragraph', content: [{ type: 'text', text: pendingInsert }] },
         ]).run();
       }
       setPendingInsert(null);
     }, [pendingInsert, editor, setPendingInsert]);

     const handlePolish = async () => {
       if (!editor || isPolishing) return;
       const selectedText = editor.state.doc.textBetween(
         editor.state.selection.from,
         editor.state.selection.to,
         ' '
       );
       if (!selectedText.trim()) return;
       setIsPolishing(true);
       try {
         const response = await orchestrator.processRequest(
           `請用物理治療專業術語優化以下文字，保持原意，輸出純文字：\n\n${selectedText}`,
           ''
         );
         if (response.message) {
           editor.chain().focus().deleteSelection().insertContent(response.message).run();
         }
       } finally {
         setIsPolishing(false);
       }
     };

     const handleExportMd = () => {
       if (!editor) return;
       const md = editor.storage.markdown.getMarkdown();
       const blob = new Blob([md], { type: 'text/markdown' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `SOAP_${new Date().toISOString().slice(0, 10)}.md`;
       a.click();
       URL.revokeObjectURL(url);
     };

     const saveLabel = () => {
       if (saveStatus === 'saving') return '儲存中...';
       if (saveStatus === 'saved') {
         const t = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
         return `已儲存 ${t}`;
       }
       return '';
     };

     return (
       <div className="flex flex-col h-full bg-white">
         {/* Header */}
         <div className="h-14 border-b flex items-center justify-between px-4 bg-gradient-to-r from-indigo-50 to-white">
           <div className="flex items-center gap-2">
             <span className="font-extrabold text-indigo-700 text-sm uppercase tracking-wider">SOAP 文件</span>
             <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-600">
               {editor?.storage.characterCount.characters() ?? 0} 字
             </Badge>
           </div>
           <div className="flex items-center gap-2">
             {saveStatus !== 'idle' && (
               <span className={cn('text-[10px] font-bold', saveStatus === 'saving' ? 'text-orange-500' : 'text-emerald-600')}>
                 {saveLabel()}
               </span>
             )}
             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExportMd} title="匯出 Markdown">
               <Download className="w-4 h-4 text-slate-500" />
             </Button>
             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.print()} title="列印 / 匯出 PDF">
               <Printer className="w-4 h-4 text-slate-500" />
             </Button>
           </div>
         </div>

         {/* Editor */}
         <div className="flex-1 overflow-y-auto p-6">
           {editor && (
             <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
               <button
                 onClick={handlePolish}
                 disabled={isPolishing}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[11px] font-bold shadow-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
               >
                 {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                 AI 潤色
               </button>
             </BubbleMenu>
           )}
           <EditorContent
             editor={editor}
             className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_h2]:text-indigo-700 [&_h2]:font-extrabold [&_h2]:text-base [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-indigo-100 [&_h2]:pb-1"
           />
         </div>
       </div>
     );
   };
   ```

5. 局部修改 `src/components/Workspace.tsx`（**3 處小改動，其餘不動**）：

   **5a.** 在 `ChatMessage` interface 加入 `intent` 欄位（`citations?` 之後）：
   ```typescript
   export interface ChatMessage {
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: Date;
     citations?: import('@/services/ai/AIOrchestrator').Citation[];
     intent?: 'CANVAS_EDIT' | 'KNOWLEDGE_QUERY' | 'CHIT_CHAT';
   }
   ```

   **5b.** 在 `handleSendMessage` 的 `assistantMsg` 物件加入 `intent` 欄位：
   ```typescript
   const assistantMsg: ChatMessage = {
     id: crypto.randomUUID(),
     role: 'assistant',
     content,
     timestamp: new Date(),
     citations: response.citations,
     intent: response.intent,
   };
   ```

   **5c.** 確認 `<DocumentEditor />` 已傳入 `projectId` prop（若已是此格式則跳過）：
   ```tsx
   <DocumentEditor projectId={projectId} />
   ```

6. 局部修改 `src/components/chat/ChatArea.tsx`（**3 處小改動，其餘不動**）：

   **6a.** 在 import 區段末尾加入：
   ```typescript
   import { useDocumentStore } from '@/store/useDocumentStore';
   ```

   **6b.** 在 component 內 `ghostCount` 之後加入：
   ```typescript
   const { setPendingInsert } = useDocumentStore();
   ```

   **6c.** 在 citation cards 區塊（`{msg.citations && ...}` 結尾）之後、timestamp `<p>` 之前插入：
   ```tsx
   {msg.intent === 'CANVAS_EDIT' && (
     <button
       onClick={() => setPendingInsert(msg.content)}
       className="mt-2 w-full py-1.5 px-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors text-left"
     >
       ＋ 插入至 Plan 區塊
     </button>
   )}
   ```

**驗收條件**：
- [ ] AC1: `npm run build` 無 TypeScript/ESLint 錯誤
- [ ] AC2: SOAP 四個 heading（S/O/A/P）正確顯示，可在 paragraph 節點輸入文字
- [ ] AC3: 停止輸入 1500ms 後 Firestore `projects/{projectId}/documents/soap` 有寫入；頁頂狀態文字在「儲存中...」與「已儲存 HH:MM」之間正確切換
- [ ] AC4: 選取文字時 BubbleMenu 出現「AI 潤色」按鈕；點擊後選取文字被 AI 回應取代
- [ ] AC5: Chat 中 CANVAS_EDIT 訊息顯示「＋ 插入至 Plan 區塊」按鈕；點擊後文字插入 DocumentEditor 的 P — Plan heading 下方
- [ ] AC6: 「匯出 MD」按鈕下載 `.md` 檔案；「列印」按鈕觸發 `window.print()`
- [ ] AC7: ChatArea 的「接受所有建議節點」按鈕（`ghostCount > 0` 條件渲染）仍然存在且功能正常

**安全規則**：
- `functions/` 目錄與 Cloud Functions 邏輯不可修改
- `useFlowStore` 的 `acceptAllGhostNodes`、`confirmFinalize` 邏輯不可改動
- `isGhost: true` flag 識別機制不可移除
- Firestore 寫入使用 `merge: true` 以避免覆蓋其他欄位
- AI 潤色呼叫經由 `orchestrator.processRequest()` → Firebase Function，不可直接呼叫 Gemini API

---

## DIRECTIVE B7-FIX: DocumentEditor 載入修復

**目標**：頁面重整後 DocumentEditor 能從 Firestore 載入先前儲存的 SOAP 內容，不再顯示空白模板

**涉及檔案**：
- `src/hooks/useDocumentSave.ts`
- `src/components/document/DocumentEditor.tsx`

**禁止範圍**：
- 不可修改 `scheduleSave` 邏輯
- 不可改動 `useFlowStore` 任何 action
- 不可改動 Cloud Functions

**步驟**：

1. 在 `src/hooks/useDocumentSave.ts` 補上 `loadDocument` 函數：

   **1a.** 確認 import 已包含 `getDoc`（若無則補上）：
   ```typescript
   import { doc, setDoc, getDoc } from 'firebase/firestore';
   ```

   **1b.** 在 `scheduleSave` 的 `useCallback` 之後，`return` 之前，插入：
   ```typescript
   const loadDocument = useCallback(async (): Promise<object | null> => {
     try {
       const snapshot = await getDoc(doc(db, 'projects', projectId, 'documents', 'soap'));
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
   ```

   **1c.** 修改 return 值，加入 `loadDocument`：
   ```typescript
   return { scheduleSave, loadDocument };
   ```

2. 在 `src/components/document/DocumentEditor.tsx` 新增掛載時載入邏輯：

   **2a.** 確認 hook 解構已包含 `loadDocument`：
   ```typescript
   const { scheduleSave, loadDocument } = useDocumentSave(projectId, setSaveStatus);
   ```

   **2b.** 在 editor 初始化的 `useEffect` **之後**插入新的 `useEffect`：
   ```typescript
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
   ```

**驗收條件**：
- [ ] AC1: `useDocumentSave` 的返回值包含 `loadDocument` 函數
- [ ] AC2: 頁面重整後，若 Firestore 有 `projects/{projectId}/documents/soap`，內容會載入到編輯器
- [ ] AC3: Firestore 尚無資料時，顯示預設 SOAP 模板（不崩潰）
- [ ] AC4: `npm run build` 無 TypeScript 錯誤
- [ ] AC5: `cancelled` flag 防止 editor 已卸載後的 `setContent` 呼叫

**安全規則**：
- `isGhost` / `confirmFinalize` 不得觸碰
- Firestore 寫入仍使用 `merge: true`

---

## DIRECTIVE B5B6-FIX: Cloud Function JSON.parse 安全防護

**目標**：將 `functions/src/index.ts` 中兩處裸露的 `JSON.parse` 包上 try-catch，防止 AI 輸出格式異常時整個 Cloud Function 崩潰

**涉及檔案**：
- `functions/src/index.ts`

**禁止範圍**：
- 不可修改 RAG pipeline（embedding / findNearest）
- 不可修改 Secret Manager 存取邏輯
- 不可修改 `CHIT_CHAT` / `CANVAS_EDIT` / `KNOWLEDGE_QUERY` 以外的分支
- 不可改動前端任何檔案

**步驟**：

1. 找到 intent 解析區塊（`JSON.parse(intentRaw)`），替換為：
   ```typescript
   // BEFORE:
   const parsed = JSON.parse(intentRaw);
   const intent: Intent = parsed.intent ?? "CHIT_CHAT";

   // AFTER:
   let intent: Intent = "CHIT_CHAT";
   try {
     const parsed = JSON.parse(intentRaw);
     intent = parsed.intent ?? "CHIT_CHAT";
   } catch {
     // malformed intent response — fall back to CHIT_CHAT
   }
   ```

2. 找到 CANVAS_EDIT proposals 解析區塊（`JSON.parse(responseText)`），替換為：
   ```typescript
   // BEFORE:
   const proposals: GhostNodeProposal[] = JSON.parse(responseText);

   // AFTER:
   let proposals: GhostNodeProposal[] = [];
   try {
     proposals = JSON.parse(responseText);
   } catch {
     // malformed proposals — return empty array
   }
   ```

**驗收條件**：
- [ ] AC1: 兩處 `JSON.parse` 都已包上 try-catch
- [ ] AC2: intent 解析失敗時，fallback 為 `"CHIT_CHAT"` 並繼續執行（不拋出）
- [ ] AC3: proposals 解析失敗時，回傳空陣列（不拋出）
- [ ] AC4: `cd functions && npm run build` 無 TypeScript 錯誤
- [ ] AC5: 其餘 Cloud Function 邏輯（RAG、Secret Manager、onCall 結構）未被更動

**安全規則**：
- Secret Manager 金鑰存取順序不可改動
- `isGhost: true` 的 ghost node flag 在 proposals 結構中不可移除

---

## DIRECTIVE B2-SEC: semanticHistory 接入 handleSendMessage

**目標**：修正 `Workspace.tsx` 中 `semanticHistory` 永遠為空字串的問題，使每輪對話後將 `[User]/[Assistant]` 條目累積到 state，讓後續 `orchestrator.processRequest` 呼叫能帶入真實的語意上下文；同時移除從未使用的 `SemanticCompressor` import 與 useMemo。

**涉及檔案**：
- `src/components/Workspace.tsx`（唯一修改目標）

**禁止範圍**：
- `src/utils/SemanticCompressor.ts` — **不可修改**（此檔案服務 canvas drag debouncing，邏輯正確）
- `orchestrator.processRequest(text, semanticHistory)` — 呼叫簽名不可變動
- `handleSendMessage` 的 `catch` / `finally` 區塊不可改動
- `semanticHistory` 的 `useState("")` 初始值不可改動
- 所有安全核心邏輯（isGhost、confirmFinalize、onSnapshot）不可觸碰

**步驟**：

1. 刪除 `SemanticCompressor` 的 import（約第 9 行）：
   ```typescript
   // 刪除此行：
   import { SemanticCompressor } from '@/utils/SemanticCompressor';
   ```

2. 刪除 `compressor` useMemo（約第 50 行）：
   ```typescript
   // 刪除此行：
   const compressor = useMemo(() => new SemanticCompressor(), []);
   ```

3. 在 `handleSendMessage` 的 `try` 區塊中，於 `setMessages(prev => [...prev, assistantMsg]);` **之後**插入：
   ```typescript
   setSemanticHistory(prev => {
     const entry = `[User]: ${text}\n[Assistant]: ${content}`;
     const updated = prev ? `${prev}\n${entry}` : entry;
     return updated.length > 2000 ? updated.slice(-2000) : updated;
   });
   ```

   修改後完整的 try 區塊如下：
   ```typescript
   try {
     const response = await orchestrator.processRequest(text, semanticHistory);
     let content: string;
     if (response.intent === 'CANVAS_EDIT') {
       content = '已根據建議更新流程圖，請確認虛線節點。';
     } else if (response.intent === 'KNOWLEDGE_QUERY') {
       content = response.message ?? '已查詢知識庫。';
     } else {
       content = response.message ?? '已處理完成。';
     }
     const assistantMsg: ChatMessage = {
       id: crypto.randomUUID(), role: 'assistant', content,
       timestamp: new Date(), citations: response.citations, intent: response.intent,
     };
     setMessages(prev => [...prev, assistantMsg]);
     setSemanticHistory(prev => {
       const entry = `[User]: ${text}\n[Assistant]: ${content}`;
       const updated = prev ? `${prev}\n${entry}` : entry;
       return updated.length > 2000 ? updated.slice(-2000) : updated;
     });
   } catch (e) {
     const errorMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '處理請求時發生錯誤，請重試。', timestamp: new Date() };
     setMessages(prev => [...prev, errorMsg]);
   } finally {
     setIsAiLoading(false);
   }
   ```

**驗收條件**：
- [ ] AC1: `grep "SemanticCompressor" src/components/Workspace.tsx` 無結果
- [ ] AC2: `grep "compressor" src/components/Workspace.tsx` 無結果
- [ ] AC3: `setSemanticHistory` 出現在 `handleSendMessage` 的 try 區塊內
- [ ] AC4: `orchestrator.processRequest(text, semanticHistory)` 呼叫簽名未被更動
- [ ] AC5: `npx tsc --noEmit` 無新增 TypeScript 錯誤

**安全規則**：
- `SemanticCompressor.ts` 本身不可修改
- `isGhost` / `confirmFinalize` 不得觸碰

---

## 2026-05-04 審查發現 (Audit Findings)

B1–B7 完整審查（2026-05-04）發現以下次要問題，已列入 Backlog 待處理：

### B1-SEC：生產環境 loading 卡住 + console.log 清理
- `App.tsx` 在 prod 環境若 `autoSignIn` 失敗，loading spinner 可能永遠不消失（缺少 finally 解除 loading 狀態）
- 多處 `console.log` 遺留在 production path

### B2-SEC：semanticHistory 永遠空值 / SemanticCompressor 未使用
- `Workspace.tsx` 宣告了 `semanticHistory` state 及 `SemanticCompressor` instance，但 `setSemanticHistory` **從未在 `handleSendMessage` 中被呼叫**
- 所有 Cloud Function 呼叫都帶著空的 `semanticHistory`，語意壓縮功能形同虛設

### B3-SEC：Ghost node accept 後 borderStyle 未清除
- `useFlowStore.ts` 的 `acceptAllGhostNodes` 重置 `opacity: 1`，但未清除 `borderStyle: "dashed"`
- 接受所有 ghost node 後，節點邊框仍保持虛線外觀

---

## Claude 審查清單 (Post-Execution Review)

Gemini 執行 Directive 後，Claude 逐項確認：

### 程式碼品質
- [ ] 沒有引入 any-typed hacks
- [ ] TypeScript 型別正確（無 `as any`, 無 `@ts-ignore`）
- [ ] 沒有未處理的 Promise（沒有 floating `.then()` 或 unhandled catch）
- [ ] 函數長度 < 50 行

### 安全性
- [ ] 沒有新的 hardcoded secrets
- [ ] 紅旗警示邏輯（15字）未被移除
- [ ] `isGhost` 資料結構未被破壞
- [ ] 沒有新的 `console.log` 遺留在 production path

### 行為正確性
- [ ] Directive 的每個驗收條件都被滿足
- [ ] 沒有 side effect 波及未被 Directive 指定的功能
- [ ] 重要的 Zustand store actions 仍然 immutable（spread pattern）

### Git
- [ ] commit message 遵循 `feat/fix/refactor: <description>` 格式
- [ ] `.env.local` 未進入 commit

---

## 不可觸碰的核心安全邏輯 (Immutable Safety Rules)

以下邏輯**任何 Directive 都不得修改**：

1. **紅旗節點 15 字驗證**（`useFlowStore.ts: confirmFinalize`）
   ```typescript
   if (reason.trim().length < 15) { /* reject */ }
   ```

2. **Ghost node 的 `isGhost` flag**：`data.isGhost: true` 的識別機制不可改動，可以改樣式但不可移除 flag

3. **Firebase onSnapshot 即時同步**：`useProjectSync.ts` 的 Firestore listener 不可在非 owner 端寫入

4. **Session-owner 控制轉移**：`approveControlTransfer()` 只有 owner 可以呼叫

---

## 進度追蹤

完成的 Directive 在此更新狀態：

| Directive | 完成日期 | Claude 審查 | 備註 |
|-----------|---------|------------|------|
| B1        | 2026-05-03 | ✅ Pass | DEV guard 雙重保護，空值 warn，prod 安全 |
| B2        | 2026-05-03 | ✅ Pass | messages state 完整；@ts-ignore+as any 已由 Claude 直接修正 |
| B3        | 2026-05-03 | ✅ Pass | acceptAllGhostNodes 已加入 store；ChatArea 按鈕正確條件渲染；style 保留 spread（改善） |
| B4        | 2026-05-03 | ✅ Pass | expires 改為 7 天；expiresAt ISO 8601 加入回應；closure 解構錯誤由 Claude 直接修正 |
| B5        | 2026-05-03 | ✅ Pass | RAG pipeline — embedding + findNearest + Gemini 合成；Citation 橘色卡片顯示 |
| B6        | 2026-05-03 | ✅ Pass | Secret Manager geminiProxy + asia-east1 + onCall；根目錄移除 @google/generative-ai |
| B7        | 2026-05-04 | ✅ Pass | Tiptap SOAP + Firestore auto-save + AI 潤色 + pendingInsert |
| B7-FIX    | 2026-05-04 | ✅ Pass | loadDocument + mount useEffect + cancelled flag；AC1–5 全過 |
| B5B6-FIX  | 2026-05-04 | ✅ Pass | JSON.parse try-catch x2；classification 適配正確；AC1–5 全過 |
| B2-SEC    | 2026-05-05 | ✅ Pass | SemanticCompressor 移除；setSemanticHistory 累加邏輯正確；AC1–5 全過 |
| B8        | -       | -          | -    |
