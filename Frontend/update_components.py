import os

dashboard_path = r"d:\TalentVerse AI\GitHub\Task 1\ResumeForge-main\ResumeForge-main\Frontend\src\pages\Dashboard.jsx"
fileupload_path = r"d:\TalentVerse AI\GitHub\Task 1\ResumeForge-main\ResumeForge-main\Frontend\src\components\ui\FileUpload.jsx"

dashboard_code = """import React, { useState } from 'react';
import FileUpload from '../components/ui/FileUpload';
import ResumeForm from '../components/forms/ResumeForm';
import BaseResumeTemplate from '../components/template/BaseResumeTemplate';
import { resumeService } from '../services/api';
import Button from '../components/ui/Button';
import { Download, FileText, RefreshCcw, ChevronLeft } from 'lucide-react';
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
          <div className="brand-icon">📄</div>
          <div className="brand-name">ResumeForge AI</div>
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
                  <h2 className="text-3xl font-black text-slate-900">Live Preview</h2>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    {['totaco', 'humres', 'huntek', 'strata'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedTemplate === t ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
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

              <div className="lg:w-80 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 sticky top-32">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Export Options</h3>
                  <p className="text-sm text-slate-500 mb-8 font-medium">Your resume is ready! Download it in your preferred company format.</p>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-100" 
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
                           <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                             <FileText size={16} />
                           </div>
                           <span className="text-sm font-bold text-slate-600 group-hover:text-primary-600 capitalize">{t}</span>
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
"""

fileupload_code = """import React, { useState, useRef } from 'react';
import { FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onUpload, loading, error }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="upload-card relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragEnter}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <div className="upload-icon-wrap"><span className="upload-icon">⭱</span></div>
                <div className="drop-title">Upload your resume</div>
                <div className="drop-sub">Drag &amp; drop, or supports PDF and DOCX files (max 5MB)</div>
                <button className="select-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                  📎 Select File
                </button>
              </div>

              <div className="divider-row"><div className="line"></div><span>OR</span><div class="line"></div></div>
              <button className="manual-btn">Fill in details manually instead →</button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center py-6"
            >
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mr-4">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => onUpload(file)} 
                  loading={loading}
                  icon={loading ? null : CheckCircle}
                  className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200"
                >
                  {loading ? 'Analyzing with AI...' : 'Parse Resume'}
                </Button>
                {!loading && (
                  <Button variant="secondary" onClick={clearFile}>
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-10" style={{ margin: '14px' }}>
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
            <p className="text-lg font-bold text-slate-800">Processing with AI</p>
            <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
              Please wait. Normal resumes take ~5 seconds, but massive 25-page resumes can take up to 60 seconds to fully process.
            </p>
          </div>
        )}
      </div>

      <div className="trust-row">
        <div className="trust-item"><span className="ico">🔒</span> Private &amp; secure</div>
        <div className="trust-item"><span className="ico">⚡</span> Ready in under 30 seconds</div>
        <div className="trust-item"><span className="ico">✓</span> ATS-optimized formatting</div>
      </div>
      
      {error && (
        <p className="mt-4 text-center text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </>
  );
};

export default FileUpload;
"""

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(dashboard_code)

with open(fileupload_path, "w", encoding="utf-8") as f:
    f.write(fileupload_code)

print("Successfully generated React components.")
