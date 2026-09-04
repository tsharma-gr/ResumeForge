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
      // Can be a structured object for university/college entries:
      {
        "institution": "string", // Institution / College / University Name (e.g. "Birmingham City University")
        "dates": "string", // Attendance period / tenure (e.g. "September 2014 – May 2019")
        "degree": "string", // Degree, Diploma, or Qualification title
        "details": ["string"], // Any bullet points or additional certificates under this institution
        "description_paragraphs": ["string"] // Paragraphs describing the course, subjects studied, or academic focus
      }
      // OR a string for simple qualifications: "Qualification Title"
    ],
    "training": ["string"],
    "certifications": ["string"],
    "awards": ["string"],
    "technical_skills": ["string"],
    "license": ["string"] // Extract driving licenses, professional licenses, CSCS cards, etc.
  }
}

INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not include markdown formatting.
- **NAME**: Extract candidate's full name.
- **LOCATION**: Extract ONLY a SINGLE geographic area: County or Country (e.g., "Berkshire" or "UK"). No city or street address.
- **EDUCATION & LICENSES**: Extract ALL educational entries, degrees, diplomas, training, certifications, and licenses. For education, preserve the Institution Name, Dates/Tenure, Degree/Qualification Title, sub-bullets, and descriptive paragraphs VERBATIM.

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
- **EDUCATION & LICENSES**: Extract any qualifications, degrees, institutions, dates, descriptive course paragraphs, certificates, or licenses (e.g. driving license) appearing in this text into "education_and_skills".

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
