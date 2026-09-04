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

    // NOTE: education_and_skills is intentionally NOT merged from work history chunks.
    // Education, skills, certifications and licenses are extracted exclusively by the
    // header prompt (which receives the top+bottom of the full CV text). Merging
    // education from work history chunks was the root cause of duplicate / partial
    // education entries appearing in the final output.
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
  
  // Normalise smart-quotes / curly apostrophes so parallel AI calls produce the same key
  const normaliseText = (str) => String(str || '')
    .replace(/[\u2018\u2019\u201a\u201b\u2032\u2035]/g, "'")  // curly single quotes → straight
    .replace(/[\u201c\u201d\u201e\u201f\u2033\u2036]/g, '"')  // curly double quotes → straight
    .replace(/\u2013|\u2014/g, '-')  // en-dash / em-dash → hyphen
    .replace(/\s+/g, ' ')
    .trim();

  // Helper for semantic qualification deduplication (splits compound titles & deduplicates word-order
  // variations). Also detects subset/superset: if one string is fully contained in another, only the
  // longer (more detailed) string survives.
  const deduplicateQuals = (rawList) => {
    // Pass 1: collect all normalised strings
    const candidates = [];
    const seen = new Set();

    const collect = (str) => {
      if (!str || typeof str !== 'string') return;
      const clean = normaliseText(str);
      if (!clean) return;

      // Split compound entries (semicolons, newlines, or commas separating distinct qualification titles)
      if (clean.includes(';') || clean.includes('\n')) {
        clean.split(/[;\n]/).forEach(part => collect(part));
        return;
      }

      if (clean.includes(',')) {
        const parts = clean.split(',');
        const qualRegex = /\b(bsc|msc|ba|ma|hnc|hnd|diploma|degree|gcse|a-level|nvq|access to|btec|foundation|certificate)\b/i;
        let countQualParts = 0;
        parts.forEach(p => { if (qualRegex.test(p)) countQualParts++; });
        if (countQualParts >= 2) {
          parts.forEach(part => collect(part));
          return;
        }
      }

      const keyExact = clean.toLowerCase().replace(/[.,;:!?]+$/, ''); // strip trailing punct
      if (!seen.has(keyExact)) {
        seen.add(keyExact);
        candidates.push(clean);
      }
    };

    rawList.forEach(item => collect(item));

    // Pass 2: remove items whose normalised text is a prefix/substring of a longer sibling
    // e.g. "10 GCSE's" is a prefix of "10 GCSE's – (Maths and English)..." → drop shorter
    const result = candidates.filter((item, i) => {
      const itemLow = item.toLowerCase();
      return !candidates.some((other, j) => {
        if (i === j) return false;
        const otherLow = other.toLowerCase();
        // If the other string starts with (or contains as a leading substring) this item,
        // and is meaningfully longer, suppress this shorter version
        return otherLow.startsWith(itemLow) && other.length > item.length + 3;
      });
    });

    // Pass 3: word-order dedup (catches "BSc Quantity Surveying" vs "Quantity Surveying BSc")
    const finalResult = [];
    const seenWordKeys = new Set();
    for (const item of result) {
      const normWords = item.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !['in', 'of', 'and', 'the', 'a', 'an', 'for', 'with', 'at'].includes(w))
        .sort()
        .join(' ');
      if (!seenWordKeys.has(normWords)) {
        seenWordKeys.add(normWords);
        finalResult.push(item);
      }
    }
    return finalResult;
  };

  // 1. Smart Institution Consolidation: Merge qualifications sharing the same institution name
  if (edSkills.qualifications && edSkills.qualifications.length > 0) {
    const instMap = new Map();
    const otherQuals = [];

    for (const item of edSkills.qualifications) {
      if (typeof item === 'object' && item !== null && item.institution) {
        // Use normaliseText so curly/straight apostrophes don't create phantom duplicates
        const normInst = normaliseText(item.institution).toLowerCase();
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
  // For dicts: key on institution+dates only (degree may legitimately differ between chunks).
  // For strings: normalise unicode + strip trailing punctuation before keying.
  for (const field of arrayFields) {
    if (edSkills[field].length > 0) {
      const seen = new Set();
      const uniqueItems = [];
      for (const item of edSkills[field]) {
        let key;
        if (typeof item === 'object' && item !== null) {
          // Use institution + dates as the identity key (NOT degree, which varies between AI chunks)
          const instNorm = normaliseText(item.institution || '').toLowerCase();
          const datesNorm = normaliseText(item.dates || '').toLowerCase();
          key = `${instNorm}||${datesNorm}` || JSON.stringify(item);
        } else {
          // For strings: normalise unicode and strip trailing punctuation
          key = normaliseText(String(item)).toLowerCase().replace(/[.,;:!?]+$/, '');
        }
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
        existingTexts.add(normaliseText(item).toLowerCase().replace(/[.,;:!?]+$/, ''));
      } else if (typeof item === 'object' && item !== null) {
        if (item.degree) existingTexts.add(normaliseText(item.degree).toLowerCase().replace(/[.,;:!?]+$/, ''));
        if (Array.isArray(item.details)) item.details.forEach(d => existingTexts.add(normaliseText(String(d)).toLowerCase().replace(/[.,;:!?]+$/, '')));
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

  // 1. Prepare Stage 1 Header Prompt.
  // Sample the top 6,000 chars AND the bottom 6,000 chars of the CV so that education
  // sections at the end of long documents are always captured by the header prompt.
  // Education, skills and certifications are extracted ONLY here — not in work history chunks.
  let headerSample = extractedText;
  if (extractedText.length > 12000) {
    headerSample = extractedText.slice(0, 6000) + "\n\n--- DOCUMENT CONTINUES / END OF CV SECTIONS ---\n\n" + extractedText.slice(-6000);
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
