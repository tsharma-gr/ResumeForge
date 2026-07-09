const path = require('path');
const fs = require('fs-extra');
const { extractTextFromPDF, extractTextFromDOCX, extractTextFromDOC, cleanText } = require('../utils/textExtractor');
const { parseResume } = require('../services/ai/resumeParser');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const env = require('../config/env');
const progressEmitter = require('../utils/progressEmitter');

// In-memory cache to store resumes temporarily without a persistent DB
const resumeCache = new Map();

// Cleanup old cache entries every hour (optional but good practice)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [id, entry] of resumeCache.entries()) {
    if (entry.createdAt < oneHourAgo) {
      resumeCache.delete(id);
    }
  }
}, 60 * 60 * 1000);

const uploadAndParse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const jobId = req.body.jobId || req.query.jobId;

    const onProgress = (message) => {
      if (jobId) {
        progressEmitter.emit(jobId, message);
      }
    };

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let rawText = '';
    onProgress('Extracting text from document...');
    if (ext === '.pdf') {
      rawText = await extractTextFromPDF(filePath);
    } else if (ext === '.docx') {
      rawText = await extractTextFromDOCX(filePath);
    } else if (ext === '.doc') {
      rawText = await extractTextFromDOC(filePath);
    }

    onProgress('Cleaning text...');
    const cleanedText = cleanText(rawText);
    
    const parsedData = await parseResume(cleanedText, onProgress);

    // IMMEDIATE CLEANUP: Delete the uploaded file after text extraction
    fs.remove(filePath).catch(err => console.error('Error deleting upload:', err));
    
    if (jobId) {
      progressEmitter.end(jobId);
    }

    const resumeId = uuidv4();
    
    // Store in memory only
    resumeCache.set(resumeId, {
      id: resumeId,
      data: parsedData,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      resumeId,
      data: parsedData,
    });
  } catch (error) {
    console.error('Upload and Parse Error:', error);
    const jobId = req.body.jobId || req.query.jobId;
    if (jobId) {
      progressEmitter.emit(jobId, `Error: ${error.message}`);
      progressEmitter.end(jobId);
    }
    if (req.file) fs.remove(req.file.path).catch(() => {});
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const streamProgress = (req, res) => {
  const { jobId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  progressEmitter.addClient(jobId, res);

  req.on('close', () => {
    progressEmitter.removeClient(jobId);
  });
};

const updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { parsedData } = req.body;

    const entry = resumeCache.get(id);
    if (!entry) {
      return res.status(404).json({ error: 'Resume not found in session' });
    }

    entry.data = parsedData;
    resumeCache.set(id, entry);

    res.json({ success: true, message: 'Resume updated in memory' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = resumeCache.get(id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Resume session expired or not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateResumeDocx = async (req, res) => {
  try {
    const { id, templateId } = req.body;
    let { data } = req.body;
    
    if (!data && id) {
      const entry = resumeCache.get(id);
      if (entry) {
        data = entry.data;
      }
    }

    if (!data) {
      return res.status(400).json({ 
        error: 'No resume data provided and session not found'
      });
    }

    const templateMap = {
      'totaco': 'CV of Totaco Template.docx',
      'humres': 'CV of Humres.docx',
      'huntek': 'CV of HunTek.docx',
      'strata': 'Strata - CVF Template.docx'
    };

    const templateFileName = templateMap[templateId] || 'CV of Totaco Template.docx';
    const templatePath = path.join(__dirname, '../', env.TEMPLATE_DIR, templateFileName);
    const outputDir = path.join(__dirname, '../uploads/generated');
    await fs.ensureDir(outputDir);
    
    const personalInfo = data.personal_info || {};
    const rawName = (personalInfo.name || 'Resume').trim();
    const nameParts = rawName.split(/\s+/);
    let displayName = rawName;
    if (nameParts.length >= 2) {
      displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    const downloadName = `CV of ${displayName}.docx`.replace(/[/\\?%*:|"<>]/g, '-');
    
    const outputId = uuidv4();
    const outputFileName = `resume_${outputId}.docx`;
    const outputPath = path.join(outputDir, outputFileName);
    
    const scriptPath = path.join(__dirname, '../scripts/fill_docx.py');
    const tempJsonPath = path.join(outputDir, `data_${outputId}.json`);
    await fs.writeJson(tempJsonPath, data);
    
    exec(`python "${scriptPath}" "${templatePath}" "${outputPath}" "${tempJsonPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Docx Generation Error:', error);
        fs.remove(tempJsonPath).catch(() => {});
        return res.status(500).json({ error: 'Failed to generate docx' });
      }
      
      res.download(outputPath, downloadName, (err) => {
        // IMMEDIATE CLEANUP: Delete both temp JSON and generated DOCX as soon as download is triggered
        fs.remove(tempJsonPath).catch(() => {});
        fs.remove(outputPath).catch(() => {});
        
        if (err) {
          console.error('Download Error:', err);
        }
      });
    });

  } catch (error) {
    console.error('Generate Docx Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadAndParse,
  streamProgress,
  updateResume,
  getResume,
  generateResumeDocx,
};
