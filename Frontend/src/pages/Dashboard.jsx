import React, { useState, useRef } from 'react';
import FileUpload from '../components/ui/FileUpload';
import ResumeForm from '../components/forms/ResumeForm';
import BaseResumeTemplate from '../components/template/BaseResumeTemplate';
import { resumeService } from '../services/api';
import Button from '../components/ui/Button';
import { Download, FileText, CheckCircle, RefreshCcw, Layout, Edit3, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';

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
      // First update the backend with current data
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
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ResumeForge AI</h1>
              {resumeData && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(() => {
              const fullName = resumeData.personal_info?.name || '';
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
              }
              return fullName;
            })()}</p>}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[
              { id: 1, name: 'Upload', icon: Layout },
              { id: 2, name: 'Edit', icon: Edit3 },
              { id: 3, name: 'Preview', icon: Eye }
            ].map((s) => (
              <div 
                key={s.id} 
                className={`flex items-center gap-2 text-sm font-bold transition-all ${step >= s.id ? 'text-blue-600 scale-105' : 'text-slate-300'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                  {s.id}
                </div>
                <span className="hidden md:inline">{s.name}</span>
                {s.id < 3 && <ChevronRight size={14} className="text-slate-200" />}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {step === 1 && (
          <div className="max-w-3xl mx-auto py-20 text-center">
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Create your premium resume.</h2>
            <p className="text-slate-500 text-xl mb-12">Upload your CV and let our AI handle the rest.</p>
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
              <FileUpload onUpload={handleUpload} loading={loading} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Review Details</h2>
              <p className="text-slate-500 font-medium">Verify the information extracted by the AI.</p>
            </div>
            <ResumeForm initialData={resumeData} onUpdate={handleUpdate} loading={loading} />
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Preview Side */}
              <div className="flex-1 flex flex-col items-center">
                <div className="mb-8 w-full flex justify-between items-center">
                  <h2 className="text-3xl font-black text-slate-900">Live Preview</h2>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    {['totaco', 'humres', 'huntek', 'strata'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedTemplate === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-200 p-8 rounded-[2rem] shadow-inner overflow-auto max-h-[800px] w-full flex justify-center border border-slate-300">
                   <div className="scale-[0.8] origin-top transform-gpu">
                     <BaseResumeTemplate data={resumeData} templateId={selectedTemplate} />
                   </div>
                </div>
              </div>

              {/* Download Side */}
              <div className="lg:w-80 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 sticky top-32">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Export Options</h3>
                  <p className="text-sm text-slate-500 mb-8 font-medium">Your resume is ready! Download it in your preferred company format.</p>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100" 
                      onClick={() => handleDownload()}
                      loading={loading}
                    >
                      <Download size={20} className="mr-2" /> Download DOCX
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">Current Template: {selectedTemplate}</p>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Switch</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {['totaco', 'humres', 'huntek', 'strata'].map((t) => (
                         <button 
                           key={t}
                           onClick={() => handleDownload(t)}
                           className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                         >
                           <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                             <FileText size={16} />
                           </div>
                           <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 capitalize">{t}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-12 text-center border-t border-slate-100">
        <p className="text-slate-400 text-sm font-medium">Powered by Advanced AI • Premium DOCX Templates</p>
      </footer>
    </div>
  );
};

export default Dashboard;
