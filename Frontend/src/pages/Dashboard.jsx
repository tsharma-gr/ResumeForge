import React, { useState } from 'react';
import FileUpload from '../components/ui/FileUpload';
import ResumeForm from '../components/forms/ResumeForm';
import BaseResumeTemplate from '../components/template/BaseResumeTemplate';
import { resumeService } from '../services/api';
import Button from '../components/ui/Button';
import { Download, FileText, RefreshCcw, ChevronLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [step, setStep] = useState(1);
  const [resumeData, setResumeData] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('totaco');

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const response = await resumeService.upload(file);
      setResumeData(response.data);
      setResumeId(response.resumeId);
      setStep(2);
      toast.success('Resume parsed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (data) => {
    setResumeData(data);
    setStep(3);
    toast.success('Details updated!');
  };

  const handleDownload = async (templateId) => {
    const tId = templateId || selectedTemplate;
    if (!resumeId) return;
    setLoading(true);
    try {
      await resumeService.update(resumeId, resumeData);
      
      const fullName = (resumeData?.personal_info?.name || 'Resume').trim();
      const nameParts = fullName.split(/\s+/);
      let displayName = fullName;
      if (nameParts.length >= 2) {
        displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
      }
      const downloadName = `CV of ${displayName}.docx`;
      
      const blob = await resumeService.generateDOCX(resumeId, tId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${tId.toUpperCase()} template downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate DOCX.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>
      <div className="noise"></div>

      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/logo.png" alt="ResumeForge Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div className="brand-name-stylized">
            <span className="text-resume">Resume</span>
            <span className="text-forge">Forge</span>
            <span className="badge-ai">AI</span>
          </div>
        </div>
        
        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}><div className="step-num">1</div><div className="step-label">Upload</div></div>
          <div className={`step-connector ${step > 1 ? 'filled' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}><div className="step-num">2</div><div className="step-label">Edit</div></div>
          <div className={`step-connector ${step > 2 ? 'filled' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}><div className="step-num">3</div><div className="step-label">Preview</div></div>
        </div>

        <div className="flex gap-2" style={{ zIndex: 10 }}>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          )}
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={() => { setResumeData(null); setStep(1); }} className="text-red-500 hover:text-red-600">
              <RefreshCcw size={16} className="mr-1" /> Start Over
            </Button>
          )}
        </div>
      </nav>

      {step === 1 && (
        <>
          <section className="hero">
            <div className="eyebrow">✨ AI-Powered Resume Builder</div>
            <h1 className="headline">Create your <span className="accent">premium resume.</span><br />Powered by AI.</h1>
            <p className="subhead">Upload your existing CV or fill in your details manually. Our AI will automatically parse, format, and generate a pixel-perfect, ATS-friendly document in seconds.</p>
          </section>
          <div className="card-wrap">
            <FileUpload onUpload={handleUpload} loading={loading} />
          </div>
        </>
      )}

      {step === 2 && (
        <main className="max-w-7xl mx-auto p-8 relative z-10">
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Review Details</h2>
              <p className="text-slate-500 font-medium">Verify the information extracted by the AI.</p>
            </div>
            <ResumeForm initialData={resumeData} onUpdate={handleUpdate} loading={loading} />
          </div>
        </main>
      )}

      {step === 3 && (
        <main className="max-w-7xl mx-auto p-8 relative z-10">
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1 flex flex-col items-center">
                <div className="mb-8 w-full flex justify-between items-center">
                  <h2 className="text-3xl font-black text-[#0F0F1A] tracking-tight">Live Preview</h2>
                  <div className="flex bg-[#FBF9FF] p-1.5 rounded-[16px] shadow-sm border-2 border-[#EBE4FA]">
                    {['totaco', 'humres', 'huntek', 'strata'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`relative px-5 py-2.5 rounded-[12px] text-[11.5px] font-bold uppercase tracking-[0.1em] transition-colors z-10 ${selectedTemplate === t ? 'text-white' : 'text-[#7A7A94] hover:text-[#0F0F1A]'}`}
                      >
                        {selectedTemplate === t && (
                          <motion.div
                            layoutId="activeTemplateTab"
                            className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] shadow-md rounded-[12px] z-[-1]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#FBFAFE] p-8 rounded-[32px] shadow-inner overflow-auto max-h-[800px] w-full flex justify-center border-2 border-[#ECE9F7]">
                   <div className="scale-[0.8] origin-top transform-gpu">
                     <BaseResumeTemplate data={resumeData} templateId={selectedTemplate} />
                   </div>
                </div>
              </div>

              <div className="lg:w-80 space-y-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-lg transition-shadow duration-300 border border-[#ECE9F7] sticky top-32">
                  <h3 className="text-[20px] font-bold text-[#0F0F1A] mb-4">Export Options</h3>
                  <p className="text-[13.5px] text-[#4B4A63] mb-8 font-medium leading-relaxed">Your resume is ready! Download it in your preferred company format.</p>
                  
                  <div className="space-y-4">
                    <Button 
                      className="w-full select-btn !mt-0 h-[54px] shadow-xl shadow-[rgba(124,58,237,0.25)] text-[15px]" 
                      onClick={() => handleDownload()}
                      loading={loading}
                    >
                      <Download size={18} className="mr-2" strokeWidth={2.5} /> Download DOCX
                    </Button>
                    <p className="text-[11px] text-center text-[#7A7A94] font-bold uppercase tracking-widest">Current Template: {selectedTemplate}</p>
                  </div>

                  <div className="mt-10 pt-8 border-t-2 border-[#ECE9F7] border-dashed">
                    <h4 className="text-[11.5px] font-bold text-[#A0A0B8] uppercase tracking-[0.1em] mb-4">Quick Switch</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {['totaco', 'humres', 'huntek', 'strata'].map((t) => (
                         <button 
                           key={t}
                           onClick={() => handleDownload(t)}
                           className="flex items-center gap-4 p-3.5 rounded-[16px] hover:bg-[#F3E8FF] transition-all group border border-transparent hover:border-[#D6C6F5]"
                         >
                           <div className="w-10 h-10 bg-[#FBFAFE] rounded-xl flex items-center justify-center text-[#A0A0B8] group-hover:bg-gradient-to-br group-hover:from-[#7C3AED] group-hover:to-[#5B21B6] group-hover:text-white transition-all shadow-sm">
                             <FileText size={18} strokeWidth={2.5} />
                           </div>
                           <span className="text-[14.5px] font-bold text-[#4B4A63] group-hover:text-[#5B21B6] capitalize tracking-tight">{t}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {step > 1 && (
        <footer className="mt-20 py-12 text-center border-t border-slate-100 relative z-10">
          <p className="text-slate-400 text-sm font-medium">Powered by Advanced AI • Premium DOCX Templates</p>
        </footer>
      )}
    </>
  );
};

export default Dashboard;
