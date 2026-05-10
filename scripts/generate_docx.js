const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ShadingType } = require("docx");

const doc = new Document({
    creator: "Gemini CLI",
    title: "PT-CDSS 專案交接報告書",
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "PT-CDSS 專案交接報告書",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "日期：", bold: true, color: "555555" }),
                        new TextRun({ text: "2026-05-09", color: "555555" }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "版本：", bold: true, color: "555555" }),
                        new TextRun({ text: "v1.2 (Premium Refactored)", color: "555555" }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "狀態：", bold: true, color: "555555" }),
                        new TextRun({ text: "穩定開發中 (Production-Ready Prototype)", color: "555555" }),
                    ],
                    spacing: { after: 400 },
                }),
                
                // Section 1
                new Paragraph({
                    text: "1. 專案概述 (Project Overview)",
                    heading: HeadingLevel.HEADING_1,
                    shading: { type: ShadingType.CLEAR, fill: "E6E6FA" },
                    spacing: { before: 240, after: 120 },
                }),
                new Paragraph({
                    text: "PT-CDSS 是一款專為物理治療師設計的臨床決策支援系統，旨在透過 AI 輔助決策流 (Clinical Flow) 與 自動化 SOAP 紀錄 (Document Editor) 提升臨床診斷效率與標準化。",
                    spacing: { after: 120 },
                }),
                new Paragraph({ text: "• 核心目標：將複雜的臨床指引轉化為直觀的互動式流程。", bullet: { level: 0 } }),
                new Paragraph({ text: "• 技術棧：React + TypeScript + TailwindCSS + Firebase + Zustand + React Flow。", bullet: { level: 0 } }),
                new Paragraph({ text: "• AI 驅動：整合 Google Gemini Pro/Flash 提供意圖辨識與決策建議。", bullet: { level: 0 }, spacing: { after: 240 } }),

                // Section 2
                new Paragraph({
                    text: "2. 目前已完成功能 (Completed Features)",
                    heading: HeadingLevel.HEADING_1,
                    shading: { type: ShadingType.CLEAR, fill: "E6E6FA" },
                    spacing: { before: 240, after: 120 },
                }),
                new Paragraph({ text: "2.1 核心架構與 UI/UX", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "✅ Premium 視覺美化：完成「Refined Hybrid」風格，包含玻璃擬物化 (Glassmorphism) 介面、深邃導覽列 (Slate-950) 與紙張感編輯器。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 多面板佈局：實作可自由拖拉的側邊欄、主作業區 (Flow/Doc) 與 洞察面版 (Chat/AI Insight)。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 響應式基礎：使用 react-resizable-panels 支援靈活的空間分配。", bullet: { level: 0 }, spacing: { after: 120 } }),

                new Paragraph({ text: "2.2 臨床決策引擎 (Flow Engine)", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "✅ 互動式流程圖：整合 React Flow，支援紅旗警示 (Red Flag) 與 診斷節點 (Flow Node)。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ AI 節點建議：初步實作 AI 推薦後續步驟 (Ghost Nodes)。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 狀態管理：使用 Zustand 管理全域 Flow 狀態，支援節點增刪與連結。", bullet: { level: 0 }, spacing: { after: 120 } }),

                new Paragraph({ text: "2.3 文件編輯系統 (Document Editor)", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "✅ SOAP 模板：基於 Tiptap 實作專門的 SOAP 紀錄區塊。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 自動儲存：實作 Debounced Sync 機制，自動同步編輯內容至 Firebase Firestore。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ AI 內容插入：支援將 AI 建議的治療計畫直接插入編輯器。", bullet: { level: 0 }, spacing: { after: 120 } }),

                new Paragraph({ text: "2.4 安全與使用者系統", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "✅ 身份驗證：整合 Firebase Google Auth。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 金鑰隱私機制 (Onboarding)：實作 BYOK (Bring Your Own Key) 模式，用戶 API Key 儲存於本地 localStorage，伺服器不留存。", bullet: { level: 0 } }),
                new Paragraph({ text: "✅ 權限控制：實作登入攔截器 (Auth Guard)，確保資料安全性。", bullet: { level: 0 }, spacing: { after: 240 } }),

                // Section 3
                new Paragraph({
                    text: "3. 待辦事項與開發中項目 (Backlog & WIP)",
                    heading: HeadingLevel.HEADING_1,
                    shading: { type: ShadingType.CLEAR, fill: "FFDAB9" },
                    spacing: { before: 240, after: 120 },
                }),
                new Paragraph({ text: "3.1 臨床內容填充 (高優先級)", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "⏳ 頸椎/腰椎路徑：需將目前的文本格式臨床指引轉化為 JSON 資料格式，匯入系統。", bullet: { level: 0 } }),
                new Paragraph({ text: "⏳ 治療手法知識庫：擴充內建的 Physical Test 與 Manual Therapy 說明。", bullet: { level: 0 }, spacing: { after: 120 } }),

                new Paragraph({ text: "3.2 功能優化", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "⏳ Ghost Node 互動強化：實作 UI 按鈕讓使用者「一鍵接受」AI 推薦的決策節點。", bullet: { level: 0 } }),
                new Paragraph({ text: "⏳ 文件匯出：實作 Markdown 與 PDF 匯出功能。", bullet: { level: 0 } }),
                new Paragraph({ text: "⏳ 編輯器進階功能：解決 Tiptap BubbleMenu 匯入衝突，實作「選取文字後 AI 潤色」。", bullet: { level: 0 }, spacing: { after: 120 } }),

                new Paragraph({ text: "3.3 基礎建設", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
                new Paragraph({ text: "⏳ 自動化測試：建立 GitHub Action 的單元測試流程。", bullet: { level: 0 } }),
                new Paragraph({ text: "⏳ 用戶設定頁：讓用戶能隨時更換其 API Key 或 調整介面偏好。", bullet: { level: 0 }, spacing: { after: 240 } }),

                // Section 4
                new Paragraph({
                    text: "4. 未來優化方向 (Future Optimization)",
                    heading: HeadingLevel.HEADING_1,
                    shading: { type: ShadingType.CLEAR, fill: "E0FFFF" },
                    spacing: { before: 240, after: 120 },
                }),
                new Paragraph({ text: "1. 行動化/平板支援：針對治療師在診間使用平板的需求，優化觸控操作與響應式佈局。", spacing: { after: 120 } }),
                new Paragraph({ text: "2. 語音輸入整合 (Voice-to-SOAP)：開發即時語音轉文字功能，將口頭診斷直接轉化為初步的 SOAP 紀錄。", spacing: { after: 120 } }),
                new Paragraph({ text: "3. 多租戶/診所管理：擴充系統以支援診所層級的帳號管理與權限分配。", spacing: { after: 120 } }),
                new Paragraph({ text: "4. 離線作業模式 (PWA)：確保在網路不穩定的診間環境下，仍能流暢作業並在連線後自動同步。", spacing: { after: 120 } }),
                new Paragraph({ text: "5. 研究數據導出：在去識別化的前提下，導出結構化決策路徑數據供臨床研究使用。", spacing: { after: 240 } }),

                // Section 5
                new Paragraph({
                    text: "5. 開發者交接須知 (Dev Notes)",
                    heading: HeadingLevel.HEADING_1,
                    shading: { type: ShadingType.CLEAR, fill: "F5F5DC" },
                    spacing: { before: 240, after: 120 },
                }),
                new Paragraph({ text: "• 環境變數：.env 需包含 Firebase 標配置與 API 端點。", bullet: { level: 0 } }),
                new Paragraph({ text: "• 本地執行：npm run dev 開啟 Vite 伺服器 (Port 5173)。", bullet: { level: 0 } }),
                new Paragraph({ text: "• 同步規範：更新後需執行同步腳本更新 Obsidian 知識庫，確保文件與代碼同步。", bullet: { level: 0 } }),
                new Paragraph({ text: "• GitHub 倉庫：https://github.com/bigshop127/PT-CDSS.git", bullet: { level: 0 }, spacing: { after: 240 } }),
                
                new Paragraph({
                    children: [
                        new TextRun({ text: "Generated by Gemini CLI - Senior Engineer Assistant", italics: true, color: "888888" }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
            ],
        },
    ],
    styles: {
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 32,
                    bold: true,
                    color: "2E74B5",
                },
                paragraph: {
                    spacing: { before: 240, after: 120 },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 28,
                    bold: true,
                    color: "1F4E79",
                },
                paragraph: {
                    spacing: { before: 120, after: 120 },
                },
            },
            {
                id: "Title",
                name: "Title",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 48,
                    bold: true,
                    color: "1F4E79",
                },
                paragraph: {
                    spacing: { after: 240 },
                    alignment: AlignmentType.CENTER,
                },
            },
        ],
    },
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../PT-CDSS_Handover_Report.docx", buffer);
    console.log("Word document generated successfully at PT-CDSS_Handover_Report.docx");
}).catch((error) => {
    console.error("Error generating document:", error);
});
