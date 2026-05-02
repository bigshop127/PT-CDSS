const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    console.log('Models:', JSON.stringify(response.data.models.map(m => m.name), null, 2));
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) console.error('Details:', JSON.stringify(e.response.data, null, 2));
  }
}

listModels();
