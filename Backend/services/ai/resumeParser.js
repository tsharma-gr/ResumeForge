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
  
  // Deduplicate education and skills arrays
  for (const field of arrayFields) {
    if (edSkills[field].length > 0) {
      edSkills[field] = [...new Set(edSkills[field])];
    }
  }

  return merged;
};

const parseResume = async (extractedText, onProgress = () => {}) => {
  // STAGE 1: Extract Header & Metadata (Personal Info, Profile, Education & Skills) from top portion of resume
  onProgress('Stage 1: Extracting Candidate Profile & Personal Details...');
  console.log('Stage 1: Extracting Candidate Profile & Personal Details...');
  
  // Sample up to 5,000 characters from top of resume for metadata & education
  const headerSample = extractedText.slice(0, 5000);
  const headerPrompt = buildHeaderParsingPrompt(headerSample);
  const headerResult = await chatCompletion(headerPrompt);

  // STAGE 2: Extract Work History in clean 5,000 character chunks
  const chunks = chunkText(extractedText, 5000);
  onProgress(`Stage 2: Parsing Work History (${chunks.length} chunks)...`);
  console.log(`Stage 2: Parsing Work History (${chunks.length} chunks)...`);
  
  const workHistoryResults = [];
  for (let i = 0; i < chunks.length; i++) {
    const msg = `Processing work history chunk ${i + 1} of ${chunks.length}`;
    console.log(msg);
    onProgress(msg);
    
    const workPrompt = buildWorkHistoryParsingPrompt(chunks[i]);
    const result = await chatCompletion(workPrompt);
    workHistoryResults.push(result);
  }
  
  onProgress('Merging results...');
  const finalResult = mergeParsedResults(headerResult, workHistoryResults);
  const finalMsg = `Extraction complete. Extracted candidate "${finalResult.personal_info?.name || 'Unknown'}" with ${finalResult.comprehensive_work_history?.length || 0} jobs.`;
  console.log(finalMsg);
  onProgress(finalMsg);
  
  return finalResult;
};

module.exports = {
  parseResume,
};
