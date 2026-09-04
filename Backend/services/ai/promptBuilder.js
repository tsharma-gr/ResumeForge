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
- **EDUCATION SEPARATION**: Extract EACH college, university, or diploma provider as a SEPARATE object in "qualifications". NEVER merge different colleges or diplomas (e.g. "Access to Higher Education Diploma") into the details array of another university. Preserve all course description paragraphs under their respective college object.
- **LICENSES**: Extract plant operator cards, CPCS, CSCS, NVQ, SMSTS, and professional tickets into "certifications". For "license", extract ONLY official driving licenses (e.g. Full UK Driving License) or official council registration licenses. Do not duplicate training certificates into license.

RESUME TEXT:
${text}
`;
};

const buildWorkHistoryParsingPrompt = (text) => {
  return `
You are an expert ATS-optimized resume parser. Extract work history, education, and licenses from the provided text.

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
  }
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include markdown formatting.
- **VERBATIM EXTRACTION**: Copy-paste paragraphs and bullet points VERBATIM without summarizing.
- **ROLE**: Short job title (1-5 words).
- **DATE FORMAT**: "MMM-YYYY" (e.g., Jan-2024).
- **EDUCATION SEPARATION**: Extract EACH college, university, or diploma as a SEPARATE object in "qualifications". Do NOT combine different colleges into one entry. Preserve all descriptive course paragraphs under their respective institution.

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
