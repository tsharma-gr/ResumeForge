const { chatCompletion } = require('./aiService');
const { 
  buildHeaderParsingPrompt, 
  buildWorkHistoryParsingPrompt 
} = require('./promptBuilder');

// Helper to chunk text safely by newlines
const chunkText = (text, maxLength = 5000) => {
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

// Helper to merge 2-stage parsed JSON results safely
const mergeParsedResults = (headerResult, workHistoryResults) => {
  const merged = {
    personal_info: headerResult?.personal_info || {},
    personal_profile: headerResult?.personal_profile || '',
    education_and_skills: headerResult?.education_and_skills || {
      qualifications: [],
      training: [],
      certifications: [],
      awards: [],
      technical_skills: [],
      license: []
    },
    employment_summary: [],
    comprehensive_work_history: []
  };

  const arrayFields = ['qualifications', 'training', 'certifications', 'awards', 'technical_skills', 'license'];
  const edSkills = merged.education_and_skills;
  for (const field of arrayFields) {
    if (!edSkills[field]) edSkills[field] = [];
  }

  for (const result of workHistoryResults) {
    if (!result) continue;
    
    // Merge comprehensive work history
    if (result.comprehensive_work_history && Array.isArray(result.comprehensive_work_history)) {
      merged.comprehensive_work_history.push(...result.comprehensive_work_history);
    }
    
    // Merge employment summary
    if (result.employment_summary && Array.isArray(result.employment_summary)) {
      merged.employment_summary.push(...result.employment_summary);
    }

    // Merge education and skills found in work history chunks
    if (result.education_and_skills) {
      for (const field of arrayFields) {
        if (Array.isArray(result.education_and_skills[field])) {
          edSkills[field].push(...result.education_and_skills[field]);
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
    merged.employment_summary = uniqueSummary.slice(0, 5);
  }
  
  // Deduplicate education and skills arrays (supporting both objects and strings)
  for (const field of arrayFields) {
    if (edSkills[field].length > 0) {
      const seen = new Set();
      const uniqueItems = [];
      for (const item of edSkills[field]) {
        let key = typeof item === 'object' && item !== null 
          ? `${item.institution || ''}-${item.degree || ''}-${item.dates || ''}`.trim()
          : String(item).trim();
        if (!key) key = JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          uniqueItems.push(item);
        }
      }
      edSkills[field] = uniqueItems;
    }
  }

  return merged;
};

const parseResume = async (extractedText, onProgress = () => {}) => {
  onProgress('Starting high-speed parallel resume extraction...');
  console.log('Starting high-speed parallel resume extraction...');

  // 1. Prepare Stage 1 Header Prompt (Top 4,500 chars AND Bottom 4,500 chars to catch Education/Licenses at end)
  let headerSample = extractedText;
  if (extractedText.length > 9000) {
    headerSample = extractedText.slice(0, 4500) + "\n\n--- END OF CV SECTIONS ---\n\n" + extractedText.slice(-4500);
  }
  const headerPrompt = buildHeaderParsingPrompt(headerSample);

  // 2. Prepare Stage 2 Work History Chunks (5,000 characters each)
  const chunks = chunkText(extractedText, 5000);
  onProgress(`Processing header & ${chunks.length} work history chunks in parallel...`);
  console.log(`Processing header & ${chunks.length} work history chunks in parallel...`);

  // Cap max_tokens to 4000 to prevent reasoning loops
  const headerPromise = chatCompletion(headerPrompt, { max_tokens: 4000 });
  const chunkPromises = chunks.map((chunk, index) => {
    console.log(`Preparing parallel chunk ${index + 1} of ${chunks.length}`);
    const workPrompt = buildWorkHistoryParsingPrompt(chunk);
    return chatCompletion(workPrompt, { max_tokens: 4000 });
  });

  // 3. Execute ALL requests in parallel simultaneously!
  const [headerResult, ...workHistoryResults] = await Promise.all([
    headerPromise,
    ...chunkPromises
  ]);

  onProgress('Merging parallel extraction results...');
  const finalResult = mergeParsedResults(headerResult, workHistoryResults);
  const finalMsg = `Extraction complete. Extracted candidate "${finalResult.personal_info?.name || 'Unknown'}" with ${finalResult.comprehensive_work_history?.length || 0} jobs.`;
  console.log(finalMsg);
  onProgress(finalMsg);

  return finalResult;
};

module.exports = {
  parseResume,
};
