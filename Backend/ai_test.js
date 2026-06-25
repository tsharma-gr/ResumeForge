const { chatCompletion } = require('./services/ai/aiService');
const { buildResumeParsingPrompt } = require('./services/ai/promptBuilder');
const fs = require('fs');

const chunkText = (text, maxLength = 10000) => {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let currentPos = 0;
  
  while (currentPos < text.length) {
    if (currentPos + maxLength >= text.length) {
      chunks.push(text.slice(currentPos));
      break;
    }
    
    let splitPos = text.lastIndexOf('\n\n\n', currentPos + maxLength);
    if (splitPos <= currentPos) {
      splitPos = text.lastIndexOf('\n\n', currentPos + maxLength);
    }
    if (splitPos <= currentPos) {
      splitPos = text.lastIndexOf('\n', currentPos + maxLength);
    }
    if (splitPos <= currentPos) {
      splitPos = currentPos + maxLength;
    }
    
    chunks.push(text.slice(currentPos, splitPos));
    currentPos = splitPos;
  }
  
  return chunks;
};

const run = async () => {
    const originalText = fs.readFileSync('D:\\TalentVerse AI\\DOCX\\original_text.txt', 'utf8');
    const chunks = chunkText(originalText, 10000);
    
    console.log("Chunk 3 length:", chunks[2].length);
    const prompt = buildResumeParsingPrompt("THIS IS CONTINUATION CHUNK 3 OF A LARGE RESUME. Focus primarily on extracting the remaining work history, education, and skills. Feel free to leave personal_info blank if not present.\n\n" + chunks[2]);
    
    const result = await chatCompletion(prompt);
    fs.writeFileSync('D:\\TalentVerse AI\\DOCX\\chunk3_test.json', JSON.stringify(result, null, 2));
    console.log("Done! Results saved.");
};

run().catch(console.error);
