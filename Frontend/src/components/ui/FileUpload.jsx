import React, { useState, useRef, useEffect } from 'react';
import { FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onUpload, loading, error }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progressLogs, setProgressLogs] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    let interval;
    if (loading) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      <motion.div 
        layout 
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="upload-card relative overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          className="hidden"
        />

        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading-ui"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center justify-center py-8"
            >
              {/* Engine Visual */}
              <div className="engine">
                <div className="engine-glow"></div>
                <div className="engine-ring engine-ring-1"></div>
                <div className="engine-ring engine-ring-2"></div>
                <div className="orbit-dot d1"></div>
                <div className="orbit-dot d2"></div>
                <div className="engine-core">
                  <img src="/logo.png" alt="ResumeForge AI" className="w-[52px] h-[52px] object-contain drop-shadow-md rounded-[10px]" />
                </div>
              </div>

              {/* Title & Timer */}
              <h1 className="text-[23px] font-bold tracking-tight flex items-center justify-center gap-[9px] mb-4 text-[#0F0F1A]">
                <span className="live-dot"></span> AI Engine Active
              </h1>
              <div className="inline-flex items-center gap-2 bg-[#EAF9EF] border border-[#CFF3DB] text-[#15803D] font-mono font-semibold text-[12.5px] tracking-[.03em] px-4 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-[blink_1.2s_ease-in-out_infinite]"></span>
                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                {(elapsedTime % 60).toString().padStart(2, '0')} ELAPSED
              </div>

              {/* Console */}
              <div className="w-[100%] max-w-[540px] flex flex-col bg-[#0B0D17] rounded-[16px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] border border-[#1E2233] text-left overflow-hidden relative console-scan shrink-0" style={{ height: '240px', minHeight: '240px' }}>
                <div className="flex items-center justify-between px-4 py-3 bg-[#11141F] border-b border-[#1E2233] shrink-0 relative z-20">
                  <div className="flex gap-[7px]">
                    <span className="w-[11px] h-[11px] rounded-full bg-[#EF4444]"></span>
                    <span className="w-[11px] h-[11px] rounded-full bg-[#F59E0B]"></span>
                    <span className="w-[11px] h-[11px] rounded-full bg-[#22C55E]"></span>
                  </div>
                  <div className="flex items-center gap-[7px] font-mono text-[10.5px] tracking-[.1em] text-[#6B7280] font-semibold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-[blink_1.3s_ease-in-out_infinite]"></span>
                    Secure Console
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto no-scrollbar flex flex-col justify-end relative z-20 font-mono space-y-1">
                  {progressLogs.map((log, i) => {
                    const isLast = i === progressLogs.length - 1;
                    const isProgress = log.text.includes('Processing chunk');
                    return (
                      <div key={i} className="flex flex-col">
                        <div className="flex items-start gap-[10px] py-[3px] animate-[lineIn_.35s_ease_forwards]">
                          <span className="text-[#4B5266] shrink-0">[{log.time}]</span>
                          <span className="text-[#7C3AED] shrink-0">›</span>
                          <span className="text-[#9CA3AF]">
                            {isProgress ? (
                                <b className="text-[#E5E7EB] font-semibold">{log.text}</b>
                            ) : log.text.includes('Total Chunks') ? (
                                <span>Total Chunks: <span className="text-[#38BDF8] font-semibold">{log.text.match(/\d+/)?.[0]}</span></span>
                            ) : (
                                <span>{log.text}</span>
                            )}
                            {isLast && <span className="cursor-block"></span>}
                          </span>
                        </div>
                        {isProgress && isLast && (
                          <div className="h-[4px] bg-[#1E2233] rounded-[3px] mt-[10px] w-full overflow-hidden shrink-0">
                            <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] rounded-[3px] w-[72%] animate-[expandWidth_.4s_ease_forwards]"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : !file ? (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
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
              key="file-selected"
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
                  onClick={() => {
                    const jobId = crypto.randomUUID();
                    const getTime = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    setProgressLogs([{ time: getTime(), text: 'Initializing AI engine...' }]);
                    setElapsedTime(0);
                    
                    const es = new EventSource(`${API_BASE}/resume/progress/${jobId}`);
                    es.onmessage = (e) => {
                      const data = JSON.parse(e.data);
                      if (data.done) {
                        es.close();
                      } else if (data.message) {
                        setProgressLogs((prev) => [...prev, { time: getTime(), text: data.message }]);
                      }
                    };
                    es.onerror = () => es.close();
                    onUpload(file, jobId);
                  }} 
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
      </motion.div>

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
