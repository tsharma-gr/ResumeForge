import React from 'react';

const BaseResumeTemplate = ({ data = {}, templateId = 'totaco' }) => {
  // Normalize data for the template
  const personalInfo = data.personal_info || {};
  const ensureArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

  const careerHistory = ensureArray(data.comprehensive_work_history || data.career_history);
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
      <div className="grid grid-cols-2 gap-y-4 mb-6 border-b border-slate-200 pb-6">
        {isHunTek ? (
          <>
            <div className="col-span-2 grid grid-cols-[100px_1fr] items-center">
              <span className="font-bold">Name:</span>
              <span className="text-slate-700 font-bold tracking-wider">{personalInfo.name} {personalInfo.rl_id}</span>
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
              <span className="text-slate-700">{personalInfo.name}</span>
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
      <div className="mb-6">
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Personal Profile
        </div>
        <p className="text-slate-700 text-justify">
          {data.personal_profile}
        </p>
      </div>

      {/* Employment Summary Table */}
      <div className="mb-6">
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
      <div className="mb-6">
        <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-[10pt] mb-4">
          Career History
        </div>
        <div className="space-y-8">
          {careerHistory.map((job, index) => {
            const isPresent = job.period?.toLowerCase().includes('current') || job.period?.toLowerCase().includes('present');
            const summaryParas = ensureArray(job.summary_paragraphs?.length ? job.summary_paragraphs : job.summary).filter(p => p && p.trim() !== '');
            const projects = ensureArray(job.projects).filter(p => p && p.trim() !== '');
            
            return (
              <div key={index}>
                <div className="font-bold text-[11pt] mb-2 border-b border-slate-100 pb-1">
                  {job.company?.toUpperCase()} {job.location && `– ${job.location}`} - {job.role} ({job.period})
                </div>
                
                {summaryParas.map((para, i) => (
                  <p key={i} className="mb-3 text-slate-700 text-[11pt] leading-relaxed">{para}</p>
                ))}
                
                {job.responsibilities_header && (
                  <div className="font-bold text-[11pt] mt-2 mb-2">{job.responsibilities_header}</div>
                )}
                
                <ul className="space-y-1">
                  {ensureArray(job.responsibilities).filter(r => r && r.trim() !== '').map((resp, i) => (
                    <li key={i} className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                      <span>•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                  
                  {projects.length > 0 && (
                    <li className="mt-4 text-slate-700 ml-4 text-[11pt]">
                      <div className="font-bold mb-2">Projects</div>
                      <ul className="space-y-1">
                        {projects.map((proj, i) => (
                          <li key={i} className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                            <span>•</span>
                            <span>{proj}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                  
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
            <div className="space-y-3">
              {education.map((edu, i) => {
                if (typeof edu === 'object' && edu !== null) {
                  const inst = edu.institution?.trim();
                  const dates = edu.dates?.trim();
                  const degree = edu.degree?.trim();
                  const details = ensureArray(edu.details).filter(d => d && String(d).trim());
                  const paras = ensureArray(edu.description_paragraphs).filter(p => p && String(p).trim());

                  return (
                    <div key={i} className="mb-2">
                      {(inst || dates) && (
                        <div className="font-bold text-slate-900 text-[11pt]">
                          {inst} {dates ? `(${dates})` : ''}
                        </div>
                      )}
                      {degree && (
                        <div className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                          <span>•</span>
                          <span>{degree}</span>
                        </div>
                      )}
                      {details.map((det, idx) => (
                        <div key={idx} className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                          <span>•</span>
                          <span>{typeof det === 'object' ? (det.title || JSON.stringify(det)) : String(det)}</span>
                        </div>
                      ))}
                      {paras.map((p, idx) => (
                        <p key={idx} className="text-slate-700 text-[11pt] leading-relaxed mt-1">{p}</p>
                      ))}
                    </div>
                  );
                }

                return (
                  <div key={i} className="flex gap-2 text-slate-700 ml-4 text-[11pt]">
                    <span>•</span>
                    <span>{String(edu)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {training.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-2 text-slate-800">Training</div>
            <ul className="space-y-1">
              {training.map((t, i) => (
                <li key={i} className="flex gap-2 text-slate-700 ml-4">
                  <span>•</span>
                  <span>{typeof t === 'object' && t !== null ? (t.title || t.name || JSON.stringify(t)) : String(t)}</span>
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
                  <span>{typeof c === 'object' && c !== null ? (c.title || c.name || JSON.stringify(c)) : String(c)}</span>
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
                  <span>{typeof skill === 'object' && skill !== null ? (skill.name || JSON.stringify(skill)) : String(skill)}</span>
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
                  <span>{typeof a === 'object' && a !== null ? (a.title || a.name || JSON.stringify(a)) : String(a)}</span>
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
                  <span>{typeof l === 'object' && l !== null ? (l.title || l.name || JSON.stringify(l)) : String(l)}</span>
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
