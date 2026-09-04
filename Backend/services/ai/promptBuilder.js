const buildHeaderParsingPrompt = (text) => {
  return `
You are an expert ATS-optimized resume parser. Your task is to extract candidate profile, personal info, education, qualifications, skills, and licenses.

SCHEMA:
{
  "personal_info": {
    "name": "string", // Extract candidate's full name
    "location": "string", // Extract only County or Country
    "sector": "", // Leave empty
    "rl_id": "" // Leave empty
  },
  "personal_profile": "string",
  "education_and_skills": {
    "qualifications": [
      // Create a SEPARATE object for EACH college, university, or diploma:
      {
        "institution": "string", // Institution / College / University Name (e.g. "Birmingham City University" or "South Gloucestershire and Stroud College")
        "dates": "string", // Attendance period / tenure (e.g. "September 2014 – May 2019" or "September 2013")
        "degree": "string", // Degree, Diploma, or Qualification title at this institution
        "details": ["string"], // Sub-bullet qualifications belonging ONLY to this specific institution
        "description_paragraphs": ["string"] // Descriptive paragraphs under this college/course (e.g. course focus, subjects studied)
      }
    ],
    "training": ["string"],
    "certifications": ["string"],
    "awards": ["string"],
    "technical_skills": ["string"],
    "license": ["string"]
  }
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include markdown formatting.
- **NAME**: Extract candidate's full name.
- **LOCATION**: Extract ONLY a SINGLE geographic area: County or Country (e.g., "Berkshire" or "UK"). No city or street address.
- **EDUCATION — THIS IS THE ONLY PROMPT THAT EXTRACTS EDUCATION**: Extract EACH college, university, school, or diploma provider as a SEPARATE object in "qualifications". NEVER merge different institutions into one entry.
- **MULTIPLE QUALIFICATIONS AT SAME INSTITUTION**: If an institution lists multiple degrees or qualifications (e.g. both a BSc AND an HNC, or multiple A-levels/GCSEs), put the primary degree in "degree" and list ALL other qualifications/degrees/diplomas at that institution as separate strings in "details". NEVER combine multiple qualifications into a single comma-separated string in "degree".
- **FULL QUALIFICATION TEXT**: Always extract the FULL qualification text verbatim. For example if the CV says "10 GCSE's – (Maths and English) were varying from grades B to E", extract the complete string — do NOT truncate to just "10 GCSE's".
- **DESCRIPTION PARAGRAPHS**: Any descriptive sentence following a qualification (e.g. subjects studied, grade ranges) belongs in "description_paragraphs" of that institution's object.
- **LICENSES & CERTIFICATIONS**: Extract plant operator cards, CPCS, CSCS, NVQ, SMSTS, SSSTS, First Aid, and professional tickets into "certifications". NEVER place CPCS or CSCS cards into "qualifications". For "license", extract ONLY official driving licenses (e.g. Full UK Driving License) or official council registration licenses. Do not duplicate training certificates into license.

RESUME TEXT:
${text}
`;
};

const buildWorkHistoryParsingPrompt = (text) => {
  return `
You are an expert ATS-optimized resume parser. Extract ONLY work history from the provided text.
Do NOT extract education, skills, certifications, or licenses — those are handled by a separate specialised prompt.

SCHEMA:
{
  "employment_summary": [
    {
      "from": "string",
      "to": "string",
      "company_name": "string",
      "position": "string"
    }
  ],
  "comprehensive_work_history": [
    {
      "company": "string",
      "location": "string",
      "role": "string",
      "period": "string",
      "summary_paragraphs": ["string"],
      "responsibilities_header": "string",
      "responsibilities": ["string"],
      "projects": ["string"],
      "reason_for_leaving": "string"
    }
  ]
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include markdown formatting.
- **VERBATIM EXTRACTION**: Copy-paste paragraphs and bullet points VERBATIM without summarizing.
- **ROLE**: Short job title (1-5 words).
- **DATE FORMAT**: Preserve the date format exactly as written in the CV (e.g., "March 2019", "Jan-2024", "2019 – Present").
- **SKIP NON-WORK SECTIONS**: If you encounter Education, Skills, Certifications, Hobbies, or Interests sections, skip them entirely — output empty arrays for employment_summary and comprehensive_work_history if the chunk contains no work history.

RESUME TEXT:
${text}
`;
};


const buildResumeParsingPrompt = (text) => {
  return `
You are an expert ATS-optimized resume parser. Your task is to extract structured information from the provided resume text.

SCHEMA:
{
  "personal_info": {
    "name": "string",
    "location": "string",
    "sector": "",
    "rl_id": ""
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
    "qualifications": [
      {
        "institution": "string",
        "dates": "string",
        "degree": "string",
        "details": ["string"],
        "description_paragraphs": ["string"]
      }
    ],
    "training": ["string"],
    "certifications": ["string"],
    "awards": ["string"],
    "technical_skills": ["string"],
    "license": ["string"]
  },
  "comprehensive_work_history": [
    {
      "company": "string",
      "location": "string",
      "role": "string",
      "period": "string",
      "summary_paragraphs": ["string"],
      "responsibilities_header": "string",
      "responsibilities": ["string"],
      "projects": ["string"],
      "reason_for_leaving": "string"
    }
  ]
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include markdown formatting.

RESUME TEXT:
${text}
`;
};

const buildTemplateAnalysisPrompt = (analysisData) => {
  return `
Analyze the following resume template structure and describe its design elements for recreation in React + Tailwind CSS.

DATA:
${analysisData}

Return a structured JSON describing these elements.
`;
};

module.exports = {
  buildHeaderParsingPrompt,
  buildWorkHistoryParsingPrompt,
  buildResumeParsingPrompt,
  buildTemplateAnalysisPrompt,
};
