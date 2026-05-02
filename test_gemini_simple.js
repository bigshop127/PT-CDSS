const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-flash-latest';

async function testGemini() {
  const prompt = 'Hello, reply with "OK" in JSON format: {"result": "OK"}';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    console.log('Response:', JSON.stringify(response.data, null, 2));
    const text = response.data.candidates[0].content.parts[0].text;
    console.log('Text:', text);
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) console.error('Details:', JSON.stringify(e.response.data, null, 2));
  }
}

testGemini();
