import React, { useState, useRef } from 'react';
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


            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center py-6"
            >
              <div className="w-full bg-[#FBF9FF] border-2 border-[#EBE4FA] rounded-[20px] p-5 flex items-center mb-8 shadow-sm transition-all hover:shadow-md hover:border-[#D6C6F5]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white rounded-2xl flex items-center justify-center mr-5 shadow-lg shadow-[rgba(124,58,237,0.3)] shrink-0">
                  <FileText size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[15px] font-bold text-[#0F0F1A] truncate tracking-tight">{file.name}</p>
                  <p className="text-[13px] font-medium text-[#7A7A94] mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={clearFile}
                  className="w-9 h-9 flex items-center justify-center text-[#7A7A94] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 w-full mt-2">
                <Button 
                  onClick={() => onUpload(file)} 
                  loading={loading}
                  icon={loading ? null : CheckCircle}
                  className="!mt-0 select-btn shadow-xl shadow-[rgba(124,58,237,0.25)] h-[50px]"
                >
                  {loading ? 'Analyzing with AI...' : 'Parse Resume'}
                </Button>
                {!loading && (
                  <button 
                    onClick={clearFile}
                    className="h-[50px] px-8 rounded-xl border-2 border-[#ECE9F7] bg-white text-[#4B4A63] font-bold text-[14px] hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F3E8FF] transition-all flex items-center justify-center"
                  >
                    Cancel
                  </button>
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
