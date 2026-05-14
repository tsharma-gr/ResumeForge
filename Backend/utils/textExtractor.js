const fs = require('fs-extra');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const extractTextFromPDF = async (filePath) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove only control characters, keep Unicode
    .replace(/\n\s*\n/g, '\n\n') // Remove excessive newlines
    .trim();
};

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  cleanText,
};
