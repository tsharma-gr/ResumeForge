const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const env = require('./config/env');
const resumeRoutes = require('./routes/resumeRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow the requesting origin (perfect for Vercel/localhost)
    callback(null, origin || '*');
  },
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/resume', resumeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

const PORT = env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
