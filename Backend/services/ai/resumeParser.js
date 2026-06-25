const { chatCompletion } = require('./aiService');
const { buildResumeParsingPrompt } = require('./promptBuilder');

// Helper to chunk text safely by newlines
const chunkText = (text, maxLength = 10000) => {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let currentPos = 0;
  
  while (currentPos < text.length) {
    if (currentPos + maxLength >= text.length) {
      chunks.push(text.slice(currentPos));
      break;
    }
    
    // Try to find a clean break between jobs (3 newlines or 2 newlines)
    let splitPos = text.lastIndexOf('\n\n\n', currentPos + maxLength);
    
    if (splitPos <= currentPos) {
      splitPos = text.lastIndexOf('\n\n', currentPos + maxLength);
    }
    
    // Fallback to single newline
    if (splitPos <= currentPos) {
      splitPos = text.lastIndexOf('\n', currentPos + maxLength);
    }
    
    // If no newline found, just hard split
    if (splitPos <= currentPos) {
      splitPos = currentPos + maxLength;
    }
    
    chunks.push(text.slice(currentPos, splitPos));
    currentPos = splitPos;
  }
  
  return chunks;
};

// Helper to merge parsed JSON chunks safely
const mergeParsedResults = (results) => {
  if (!results || results.length === 0) return {};
  if (results.length === 1) return results[0];
  
  const merged = { ...results[0] };
  
  if (!merged.comprehensive_work_history) merged.comprehensive_work_history = [];
  if (!merged.employment_summary) merged.employment_summary = [];
  if (!merged.education_and_skills) merged.education_and_skills = {};
  
  const edSkills = merged.education_and_skills;
  const arrayFields = ['qualifications', 'training', 'certifications', 'awards', 'technical_skills', 'license'];
  
  for (const field of arrayFields) {
    if (!edSkills[field]) edSkills[field] = [];
  }

  for (let i = 1; i < results.length; i++) {
    const nextResult = results[i];
    
    // Merge comprehensive work history
    if (nextResult.comprehensive_work_history && Array.isArray(nextResult.comprehensive_work_history)) {
      merged.comprehensive_work_history.push(...nextResult.comprehensive_work_history);
    }
    
    // Merge employment summary
    if (nextResult.employment_summary && Array.isArray(nextResult.employment_summary)) {
      merged.employment_summary.push(...nextResult.employment_summary);
    }
    
    // Merge education and skills
    if (nextResult.education_and_skills) {
      for (const field of arrayFields) {
        if (Array.isArray(nextResult.education_and_skills[field])) {
          edSkills[field].push(...nextResult.education_and_skills[field]);
        }
      }
    }
  }
  
  // Deduplicate employment summary based on company name
  if (merged.employment_summary.length > 0) {
    const uniqueSummary = [];
    const seen = new Set();
    for (const job of merged.employment_summary) {
      const key = `${job.company_name}-${job.position}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSummary.push(job);
      }
    }
    // Limit to top 5
    merged.employment_summary = uniqueSummary.slice(0, 5);
  }
  
  // Deduplicate education and skills arrays
  for (const field of arrayFields) {
    if (edSkills[field].length > 0) {
      edSkills[field] = [...new Set(edSkills[field])];
    }
  }

  return merged;
};

const parseResume = async (extractedText) => {
  const chunks = chunkText(extractedText, 10000); // 10000 characters hits the perfect sweet spot
  
  const parsedResults = [];
  
  // Process sequentially to avoid API rate limits
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1} of ${chunks.length} (length: ${chunks[i].length})`);
    
    let promptPrefix = i > 0 
      ? `THIS IS CONTINUATION CHUNK ${i+1} OF A LARGE RESUME. Focus primarily on extracting the remaining work history, education, and skills. Feel free to leave personal_info blank if not present.\n\n` 
      : "";
      
    const prompt = buildResumeParsingPrompt(promptPrefix + chunks[i]);
    const result = await chatCompletion(prompt);
    parsedResults.push(result);
  }
  
  const finalResult = mergeParsedResults(parsedResults);
  console.log(`Merged results. Total jobs extracted: ${finalResult.comprehensive_work_history?.length || 0}`);
  
  return finalResult;
};

module.exports = {
  parseResume,
};
