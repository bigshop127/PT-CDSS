const express = require('express');
const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const Handlebars = require('handlebars');
const admin = require('firebase-admin');

// Initialize Firebase Admin (ADC will be used in Cloud Run)
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
app.use(express.json());

// Section 3.D: Concurrency Control to prevent OOM
const limit = pLimit(3); // Limit to 3 concurrent renders

/**
 * Section 3.D: TreeBuilder Logic (DFS Implementation)
 */
function buildTree(nodes, edges, parentId = null) {
  const currentNodes = nodes.filter(n => {
    const parentEdge = edges.find(e => e.target === n.id);
    return parentId ? parentEdge?.source === parentId : !parentEdge;
  });

  return currentNodes.map(node => ({
    ...node,
    children: buildTree(nodes, edges, node.id)
  }));
}

app.post('/export', async (req, res) => {
  const { projectId, chartId, version } = req.body;

  if (!projectId || !chartId) {
    return res.status(400).send('Missing projectId or chartId');
  }

  try {
    // 1. Fetch data from Firestore using ADC
    const snapshot = await db.collection('projects').doc(projectId)
      .collection('versions').doc(version || 'latest').get();
    
    if (!snapshot.exists) {
      return res.status(404).send('Version not found');
    }

    const { nodes, edges } = snapshot.data();

    // 2. Build Tree Structure
    const treeData = buildTree(nodes, edges);

    // 3. Queue for Rendering (p-limit)
    const imageUrl = await limit(async () => {
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage' // Section 3.D: Performance Shield
        ]
      });

      const page = await browser.newPage();
      
      // Load Handlebars Template (Mocked here, would usually read a .hbs file)
      const templateSource = `
        <html>
          <body style="font-family: Arial; padding: 40px;">
            <h1>Clinical Flowchart</h1>
            <pre>{{json treeData}}</pre>
          </body>
        </html>
      `;
      Handlebars.registerHelper('json', (obj) => JSON.stringify(obj, null, 2));
      const template = Handlebars.compile(templateSource);
      const html = template({ treeData });

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buffer = await page.screenshot({ fullPage: true });
      await browser.close();

      // 4. Upload to Firebase Storage
      const fileName = `exports/${projectId}/${chartId}_${Date.now()}.png`;
      const file = bucket.file(fileName);
      await file.save(buffer, { contentType: 'image/png' });
      
      // Generate Signed URL or Public URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });
      return url;
    });

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Export service listening on port ${PORT}`);
});
