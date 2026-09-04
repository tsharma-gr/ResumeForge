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

  // Deduplicate employment summary based on company name (and filter entries without dates)
  if (merged.employment_summary.length > 0) {
    const uniqueSummary = [];
    const seen = new Set();
    for (const job of merged.employment_summary) {
      if (!job || typeof job !== 'object') continue;
      const fromVal = (job.from || '').trim();
      const toVal = (job.to || '').trim();
      if (!fromVal && !toVal) continue; // Skip date-less entries like hobbies or sports teams
      const companyRaw = (job.company_name || '').trim();
      if (!companyRaw) continue;
      
      const key = `${companyRaw.toLowerCase()}-${(job.position || '').toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSummary.push(job);
      }
    }
    merged.employment_summary = uniqueSummary.slice(0, 5);
  }
  
  // Helper for semantic qualification deduplication (splits compound titles & deduplicates word-order variations)
  const deduplicateQuals = (rawList) => {
    const result = [];
    const seenKeys = new Set();

    const processItem = (str) => {
      if (!str || typeof str !== 'string') return;
      const cleanStr = str.strip ? str.strip() : String(str).trim();
      if (!cleanStr) return;

      // Handle compound strings like "Degree A; Degree B" or "Degree A \n Degree B"
      if (cleanStr.includes(';') || cleanStr.includes('\n')) {
        cleanStr.split(/[;\n]/).forEach(part => processItem(part));
        return;
      }

      // Create normalized key (sorted significant words to catch reordered strings like "First Class BSc..." vs "BSc... First Class")
      const normWords = cleanStr.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !['in', 'of', 'and', 'the', 'a', 'an', 'for', 'with', 'at'].includes(w))
        .sort();

      const keyExact = cleanStr.toLowerCase().replace(/\s+/g, ' ');
      const keyWords = normWords.join(' ');

      if (keyExact && !seenKeys.has(keyExact) && (!keyWords || !seenKeys.has(keyWords))) {
        seenKeys.add(keyExact);
        if (keyWords) seenKeys.add(keyWords);
        result.push(cleanStr);
      }
    };

    rawList.forEach(item => processItem(item));
    return result;
  };

  // 1. Smart Institution Consolidation: Merge qualifications sharing the same institution name
  if (edSkills.qualifications && edSkills.qualifications.length > 0) {
    const instMap = new Map();
    const otherQuals = [];

    for (const item of edSkills.qualifications) {
      if (typeof item === 'object' && item !== null && item.institution) {
        const normInst = item.institution.trim().toLowerCase();
        if (!instMap.has(normInst)) {
          instMap.set(normInst, {
            institution: item.institution.trim(),
            dates: item.dates || '',
            degrees: item.degree ? [item.degree.trim()] : [],
            details: Array.isArray(item.details) ? item.details.map(d => String(d).trim()).filter(Boolean) : [],
            description_paragraphs: Array.isArray(item.description_paragraphs) ? item.description_paragraphs.map(p => String(p).trim()).filter(Boolean) : []
          });
        } else {
          const existing = instMap.get(normInst);
          if (!existing.dates && item.dates) existing.dates = item.dates;
          if (item.degree) existing.degrees.push(item.degree.trim());
          if (Array.isArray(item.details)) {
            for (const d of item.details) {
              const dStr = String(d).trim();
              if (dStr) existing.details.push(dStr);
            }
          }
          if (Array.isArray(item.description_paragraphs)) {
            for (const p of item.description_paragraphs) {
              const pNorm = String(p).replace(/\s+/g, ' ').trim();
              if (pNorm && !existing.description_paragraphs.some(existingP => existingP.replace(/\s+/g, ' ').trim() === pNorm)) {
                existing.description_paragraphs.push(String(p).trim());
              }
            }
          }
        }
      } else {
        otherQuals.push(item);
      }
    }

    const mergedInstObjects = Array.from(instMap.values()).map(instObj => {
      const allQualsRaw = [...instObj.degrees, ...instObj.details];
      const cleanQuals = deduplicateQuals(allQualsRaw);

      const primaryDegree = cleanQuals[0] || '';
      const finalDetails = cleanQuals.slice(1);

      return {
        institution: instObj.institution,
        dates: instObj.dates,
        degree: primaryDegree,
        details: finalDetails,
        description_paragraphs: instObj.description_paragraphs
      };
    });

    edSkills.qualifications = [...mergedInstObjects, ...otherQuals];
  }

  // 2. Deduplicate individual education and skills arrays
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

  // 3. Cross-Deduplication: Prevent items in certifications/training/qualifications from repeating in license
  const existingTexts = new Set();
  const extractTexts = (items) => {
    for (const item of items) {
      if (typeof item === 'string') {
        existingTexts.add(item.trim().toLowerCase());
      } else if (typeof item === 'object' && item !== null) {
        if (item.degree) existingTexts.add(item.degree.trim().toLowerCase());
        if (Array.isArray(item.details)) item.details.forEach(d => existingTexts.add(String(d).trim().toLowerCase()));
      }
    }
  };

  extractTexts(edSkills.qualifications);
  extractTexts(edSkills.training);
  extractTexts(edSkills.certifications);
  extractTexts(edSkills.awards);

  if (edSkills.license && edSkills.license.length > 0) {
    edSkills.license = edSkills.license.filter(lic => {
      const licText = typeof lic === 'object' ? JSON.stringify(lic).toLowerCase() : String(lic).trim().toLowerCase();
      // Remove if this item is already in certifications, qualifications, training, or awards
      for (const existing of existingTexts) {
        if (existing.includes(licText) || licText.includes(existing)) {
          return false;
        }
      }
      return true;
    });
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
