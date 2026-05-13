const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.2,
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
  MONGO_URI: process.env.MONGO_URI,
  STORAGE_MODE: process.env.STORAGE_MODE || 'json',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TEMPLATE_DIR: process.env.TEMPLATE_DIR || 'templates',
};
