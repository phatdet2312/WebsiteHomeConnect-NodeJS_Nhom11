// apps/services/geminiService.js
const fetch = require('node-fetch');
require('dotenv').config();

const chat = async (userMessage, context = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  const endpoint = `${baseUrl}/models/gemini-pro:generateContent?key=${apiKey}`;

  const systemContext = `Bạn là trợ lý tư vấn bất động sản thông minh của HomeConnect.
Nhiệm vụ của bạn là giúp khách hàng tìm kiếm căn hộ phù hợp, tư vấn về giá cả, vị trí, tiện ích và các vấn đề liên quan.
Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
${context ? 'Thông tin ngữ cảnh hiện tại: ' + context : ''}`;

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: systemContext + '\n\nKhách hàng hỏi: ' + userMessage }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.';
};

module.exports = { chat };
