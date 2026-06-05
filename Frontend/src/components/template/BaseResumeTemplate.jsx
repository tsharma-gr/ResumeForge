import React from 'react';

const BaseResumeTemplate = ({ data = {}, templateId = 'totaco' }) => {
  // Normalize data for the template
  const personalInfo = data.personal_info || {};
  const ensureArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

  const careerHistory = ensureArray(data.career_history);
  const edSkills = data.education_and_skills || {};
  
  const isHunTek = templateId === 'huntek';
  const isHumres = templateId === 'humres';
  
  const education = ensureArray(edSkills.qualifications);
  const training = ensureArray(edSkills.training);
  const certifications = ensureArray(edSkills.certifications);
  const awards = ensureArray(edSkills.awards);
  const skills = ensureArray(edSkills.technical_skills);
  const license = ensureArray(edSkills.license);
  const employmentSummary = data.employment_summary ? ensureArray(data.employment_summary) : careerHistory;

  return (
    <div className="w-[800px] min-h-[1100px] bg-white p-[50px] shadow-2xl mx-auto text-[11pt] font-serif leading-relaxed text-slate-900 border border-slate-200">
      {/* Header Bar */}
      <div className="bg-black text-white text-center py-2 font-bold tracking-[0.2em] uppercase text-[12pt] mb-8">
        Curriculum Vitae
      </div>

      {/* Basic Info Table */}
      <div className="grid grid-cols-2 gap-y-4 mb-10 border-b border-slate-200 pb-8">
        {isHunTek ? (
          <>
            <div className="col-span-2 grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Name:</span>
              <span className="text-slate-700 font-bold uppercase tracking-wider">{personalInfo.name} {personalInfo.rl_id}</span>
            </div>
            <div className="col-span-2 grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Location:</span>
              <span className="text-slate-700">{personalInfo.location}</span>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Name:</span>
              <span className="text-slate-700 uppercase">{personalInfo.name}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Location:</span>
              <span className="text-slate-700">{personalInfo.location}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Sector:</span>
              <span className="text-slate-700">{personalInfo.sector}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">RL ID:</span>
              <span className="text-slate-700">{personalInfo.rl_id}</span>
            </div>
          </>
        )}
      </div>

      {/* Personal Profile Section */}
      <div className="mb-10">
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Personal Profile
        </div>
        <p className="text-slate-700 text-justify">
          {data.personal_profile}
        </p>
      </div>

      {/* Employment Summary Table */}
      <div className="mb-10">
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Summary of Employment
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-3 font-bold text-[9pt] uppercase">From</th>
              <th className="py-2 px-3 font-bold text-[9pt] uppercase">To</th>
              <th className="py-2 px-3 font-bold text-[9pt] uppercase">Company</th>
              <th className="py-2 px-3 font-bold text-[9pt] uppercase">Position</th>
            </tr>
          </thead>
          <tbody>
            {employmentSummary.map((job, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-0">
                <td className="py-3 px-3 text-[9.5pt]">{job.from || job.period?.split('-')[0]}</td>
                <td className="py-3 px-3 text-[9.5pt]">{job.to || job.period?.split('-')[1]}</td>
                <td className="py-3 px-3 text-[9.5pt] font-medium">{job.company_name || job.company}</td>
                <td className="py-3 px-3 text-[9.5pt]">{job.position || job.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Career History */}
      <div className="mb-10">
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Career History
        </div>
        <div className="space-y-8">
          {careerHistory.map((job, index) => {
            const isPresent = job.period?.toLowerCase().includes('current') || job.period?.toLowerCase().includes('present');
            return (
              <div key={index}>
                <div className="font-bold text-[11pt] mb-2 border-b border-slate-100 pb-1">
                  {job.company?.toUpperCase()} {job.location && `– ${job.location}`} - {job.role} ({job.period})
                </div>
                {isPresent ? (
                  <>
                    <p className="mb-3 text-slate-700 text-[11pt] leading-relaxed">{job.summary}</p>
                    <div className="font-bold text-[11pt] mb-2">Key responsibilities:</div>
                  </>
                ) : (
                  job.summary && (
                    <div className="flex gap-2 text-slate-700 mb-1 ml-4 text-[11pt]">
                      <span>•</span>
                      <span>{job.summary}</span>
                    </div>
                  )
                )}
                <ul className="space-y-1">
                  {ensureArray(job.responsibilities).map((resp, i) => (
                    <li key={i} className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                      <span>•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                  {job.reason_for_leaving && (
                    <li className="mt-2 font-medium ml-4 text-[11pt]">
                      • Reason for leaving - {job.reason_for_leaving}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education & Skills */}
      <div>
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Education & Skills
        </div>
        
        {education.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Education/Qualification</div>
            <ul className="space-y-1">
              {education.map((edu, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{edu}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {training.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Training</div>
            <ul className="space-y-1">
              {training.map((t, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Certifications</div>
            <ul className="space-y-1">
              {certifications.map((c, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Skills/Technical Skills</div>
            <ul className="space-y-1">
              {skills.map((skill, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {awards.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Awards</div>
            <ul className="space-y-1">
              {awards.map((a, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {license.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">License</div>
            <ul className="space-y-1">
              {license.map((l, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseResumeTemplate;
