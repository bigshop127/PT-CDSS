import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const COLLECTION_NAME = 'knowledge_base';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

// Initialize Firebase Admin
if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
  });
} else {
  console.error(`Error: Service account file not found at ${SERVICE_ACCOUNT_PATH}`);
  console.log('Please download your service account key from Firebase Console and save it to scripts/service-account.json');
  process.exit(1);
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function ingestPDF(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`Processing: ${fileName}...`);

  const dataBuffer = fs.readFileSync(filePath);

  // We want to extract text page by page if possible. 
  // pdf-parse's default behavior is to return everything.
  // We'll use the options to capture pages.
  
  let currentPage = 0;
  const pages: { text: string; pageNumber: number }[] = [];

  const options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        currentPage++;
        pages.push({ text, pageNumber: currentPage });
        return text;
      });
    }
  };

  try {
    await pdf(dataBuffer, options);
    console.log(`Extracted ${pages.length} pages from ${fileName}`);

    for (const page of pages) {
      if (!page.text.trim()) continue;

      console.log(`  Embedding page ${page.pageNumber}...`);
      
      const result = await embeddingModel.embedContent(page.text);
      const embedding = result.embedding.values;

      await db.collection(COLLECTION_NAME).add({
        text: page.text,
        embedding: admin.firestore.FieldValue.vector(embedding),
        metadata: {
          book: fileName,
          page: page.pageNumber,
          ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }

    console.log(`Successfully ingested ${fileName}`);
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Error: Data directory not found at ${DATA_DIR}`);
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('No PDF files found in data directory.');
    return;
  }

  for (const file of files) {
    await ingestPDF(path.join(DATA_DIR, file));
  }

  console.log('Ingestion process complete.');
}

main().catch(console.error);
