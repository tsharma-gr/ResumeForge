const buildResumeParsingPrompt = (text) => {
  return `
You are an expert ATS-optimized resume parser. Your task is to extract structured information from the provided resume text.

SCHEMA:
{
  "personal_info": {
    "name": "string", // Extract candidate's full name
    "location": "string", // Extract only County or Country
    "sector": "", // Leave empty for manual user entry
    "rl_id": "" // Leave empty for manual user entry
  },
  "personal_profile": "string",
  "employment_summary": [
    {
      "from": "string",
      "to": "string",
      "company_name": "string",
      "position": "string"
    }
  ],
  "education_and_skills": {
    "qualifications": ["string"],
    "training": ["string"],
    "certifications": ["string"],
    "awards": ["string"],
    "technical_skills": ["string"],
    "license": ["string"]
  },
  "comprehensive_work_history": [ // MUST BE VERBATIM COPY-PASTE, DO NOT SUMMARIZE
    {
      "company": "string",
      "location": "string",
      "role": "string",
      "period": "string",
      "summary_paragraphs": ["string"], // Extract EACH introductory paragraph as a separate string.
      "responsibilities_header": "string", // If the CV uses a header like "Key Responsibilities", extract it here exactly. Otherwise leave empty.
      "responsibilities": ["string"], // Extract EACH bullet point separately
      "projects": ["string"], // Extract EACH project title and description as separate strings
      "reason_for_leaving": "string"
    }
  ]
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include any markdown formatting.
- If a field is not found, use an empty string or empty array.
- **1. COMPREHENSIVE WORK HISTORY (UNLIMITED)**: You MUST extract EVERY SINGLE job and company from the CV. If there are 15 companies, list all 15. There is NO limit here. Use the "comprehensive_work_history" key.
- **2. EMPLOYMENT SUMMARY (LIMITED TO 5)**: ONLY this specific section is limited to the 5 most recent companies.
- **3. VERBATIM EXTRACTION**: For the comprehensive history, you MUST copy-paste paragraphs and bullets VERBATIM. Each bullet point from the CV must be a separate item in the "responsibilities" or "projects" array.
- **ROLE**: This MUST be a short, professional job title (e.g., "Contracts Manager", "Electrician"). Aim for 1-5 words. If you find a list of services or tasks (like "Maintenance Surveys"), do NOT put them in the Role field; extract them as "summary_paragraphs" or "responsibilities".
- **SUMMARY_PARAGRAPHS**: This array MUST contain EVERY introductory paragraph and any narrative list of services for the role, unedited. Do NOT skip any descriptive text.
- **RESPONSIBILITIES_HEADER**: If the original CV uses a specific heading for the responsibilities (e.g., "Key Responsibilities"), extract it here.
- **RESPONSIBILITIES**: This array MUST contain the job content that was presented as BULLET POINTS in the original CV. Preserve the exact number of bullet points.
- **PROJECTS**: If the CV lists specific "Projects" or "Key Projects" under a job, extract them as separate strings in the "projects" array.
- **4. DATE FORMAT**: "MMM-YYYY" (e.g., Jan-2024).
- **5. EDUCATION & SKILLS FORMAT**: Capture EVERY educational entry, training course, and certification. Do NOT summarize or skip any details.
  - **YEAR EXTRACTION**: Look for years (4-digit numbers like 2005, 2010) anywhere in the entry. 
  - **FORMATTING**: Extract the year and reformat the entry as "Year - Qualification Name - Institution/Provider". If a grade or specific subjects are mentioned, include them (e.g., "2005 - BSc Hons Electrical Engineering (2:1) - University of London"). 
  - **NO MISSING DATA**: If a candidate lists 10 different certificates or 5 different schools, list all of them.
- **6. MANUAL FIELDS**: 
  - **NAME**: Extract the candidate's full name.
  - **LOCATION**: Extract ONLY a SINGLE geographic area: the **County** OR the **Country** (e.g., "Berkshire" or "UK"). Do NOT include city names (like "Reading" or "London"), postal codes, or street addresses. If both are present, pick the County.
  - **SECTOR/RL ID**: Leave these two as empty strings.
- **7. PRESERVE STRUCTURE**: It is CRITICAL to match the structure of the original CV. If a section is in paragraphs, extract them into "summary_paragraphs". If it is bulleted, extract it into "responsibilities".
- **8. NO MISSING DATA**: Do not summarize. Do not skip paragraphs. Every single line of text from the professional experience section MUST be extracted. If a job only has a company name and a list of tasks, put the tasks in "summary_paragraphs" or "responsibilities", NOT in the "role" field.
- **9. IGNORE**: References, Interests, Languages.

RESUME TEXT:
${text}
`;
};

const buildTemplateAnalysisPrompt = (analysisData) => {
  return `
Analyze the following resume template structure and describe its design elements for recreation in React + Tailwind CSS.

ASPECTS TO ANALYZE:
- Layout structure (Single column, Multi-column, Sidebar)
- Section ordering
- Typography (Serif, Sans-serif, font sizes)
- Spacing and alignment
- Colors (Primary, secondary, text colors)
- Experience/Education card layouts

DATA:
${analysisData}

Return a structured JSON describing these elements.
`;
};

module.exports = {
  buildResumeParsingPrompt,
  buildTemplateAnalysisPrompt,
};
