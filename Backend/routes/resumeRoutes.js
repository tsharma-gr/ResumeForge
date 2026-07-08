const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const resumeController = require('../controllers/resumeController');


// Resume routes
router.post('/upload', upload.single('file'), resumeController.uploadAndParse);
router.get('/progress/:jobId', resumeController.streamProgress);
router.put('/:id', resumeController.updateResume);
router.get('/:id', resumeController.getResume);

// DOCX generation routes
router.post('/generate-docx', resumeController.generateResumeDocx);

module.exports = router;

