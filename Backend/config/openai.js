const { OpenAI } = require('openai');
const env = require('./env');

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds timeout per AI completion request
  maxRetries: 2,
});

module.exports = openai;
