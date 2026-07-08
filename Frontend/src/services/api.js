import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resumeService = {
  upload: async (file, jobId = null) => {
    const formData = new FormData();
    if (jobId) formData.append('jobId', jobId);
    formData.append('file', file);
    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id, parsedData) => {
    const response = await api.put(`/resume/${id}`, { parsedData });
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/resume/${id}`);
    return response.data;
  },

  generatePDF: async (htmlContent, filename) => {
    const response = await api.post('/resume/generate', { htmlContent, filename }, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  generateDOCX: async (id, templateId) => {
    const response = await api.post('/resume/generate-docx', { id, templateId }, {
      responseType: 'blob',
    });
    return response.data;
  },
};


export default api;
