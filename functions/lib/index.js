"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const INTENT_SYSTEM_PROMPT = `You are an Intent Classifier for a PT-CDSS.
Classify user input into one of: CANVAS_EDIT, KNOWLEDGE_QUERY, CHIT_CHAT.
Output ONLY valid JSON: { "intent": "...", "confidence": number }`;
const CANVAS_SYSTEM_PROMPT = `You are the Clinical Logic Engine for a PT-CDSS.
Propose ghost node modifications to a React Flow clinical flowchart.
Output ONLY a JSON array of proposals:
[{ "id": "ghost_1", "label": "...", "type": "default"|"redFlag", "position": {"x":0,"y":0}, "citation": "...", "parentId": "..." }]`;
const KNOWLEDGE_SYSTEM_PROMPT = `你是 PT-CDSS 的臨床知識助理。根據以下提供的參考文獻內容，用繁體中文回答使用者的問題。回答需簡潔、臨床導向，並忠實於原文資料。`;
exports.geminiProxy = (0, https_1.onCall)({
    secrets: [geminiApiKey],
    region: "asia-east1",
    timeoutSeconds: 120,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    const { userInput, semanticHistory, nodes, edges } = request.data;
    if (!userInput || typeof userInput !== "string") {
        throw new https_1.HttpsError("invalid-argument", "userInput is required.");
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey.value());
    // Step 1: Classify intent
    const intentModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        systemInstruction: INTENT_SYSTEM_PROMPT,
    });
    const intentResult = await intentModel.generateContent(userInput);
    const intentRaw = intentResult.response.text().replace(/```json|```/g, "").trim();
    let classification = { intent: "CHIT_CHAT" };
    try {
        classification = JSON.parse(intentRaw);
    }
    catch (_a) {
        // malformed intent response — fall back to CHIT_CHAT
    }
    if (classification.intent === "CANVAS_EDIT") {
        const canvasModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: CANVAS_SYSTEM_PROMPT,
        });
        const prompt = `USER REQUEST: ${userInput}
SEMANTIC HISTORY: ${semanticHistory}
CURRENT NODES: ${JSON.stringify(nodes)}
CURRENT EDGES: ${JSON.stringify(edges)}
PROPOSE LOGICAL NEXT STEPS AS GHOST NODES.`;
        const result = await canvasModel.generateContent(prompt);
        const responseText = result.response.text().replace(/```json|```/g, "").trim();
        let proposals = [];
        try {
            proposals = JSON.parse(responseText);
        }
        catch (_b) {
            // malformed proposals — return empty array, client shows no ghost nodes
        }
        return { intent: "CANVAS_EDIT", proposals };
    }
    if (classification.intent === "KNOWLEDGE_QUERY") {
        const db = admin.firestore();
        // Step 2a: Embed the query
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(userInput);
        const queryVector = embeddingResult.embedding.values;
        // Step 2b: Vector search — top 5 nearest chunks (DOT_PRODUCT)
        const vectorQuery = db.collection("knowledge_base").findNearest("embedding", admin.firestore.FieldValue.vector(queryVector), { limit: 5, distanceMeasure: "DOT_PRODUCT" });
        const snapshot = await vectorQuery.get();
        const citations = snapshot.docs.map((doc) => {
            var _a, _b, _c, _d, _e;
            const data = doc.data();
            const text = (_a = data.text) !== null && _a !== void 0 ? _a : "";
            return {
                book: (_c = (_b = data.metadata) === null || _b === void 0 ? void 0 : _b.book) !== null && _c !== void 0 ? _c : "未知書目",
                page: (_e = (_d = data.metadata) === null || _d === void 0 ? void 0 : _d.page) !== null && _e !== void 0 ? _e : 0,
                excerpt: text.substring(0, 300),
            };
        });
        // Step 2c: RAG synthesis
        const contextText = citations
            .map((c) => `【${c.book} 第 ${c.page} 頁】\n${c.excerpt}`)
            .join("\n\n");
        const knowledgeModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: KNOWLEDGE_SYSTEM_PROMPT,
        });
        const answerResult = await knowledgeModel.generateContent(`參考文獻：\n${contextText}\n\n使用者問題：${userInput}`);
        const answerText = answerResult.response.text();
        return { intent: "KNOWLEDGE_QUERY", message: answerText, citations };
    }
    // Default to CHIT_CHAT but actually call Gemini
    const chatModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "你是 PT-CDSS 臨床助手。請針對使用者的臨床問題、記錄優化需求或一般諮詢提供專業建議。若使用者要求優化文字，請直接輸出優化後的內容。",
    });
    const chatResult = await chatModel.generateContent(userInput);
    const chatText = chatResult.response.text();
    return { intent: "CHIT_CHAT", message: chatText };
});
//# sourceMappingURL=index.js.map