import axios from 'axios';

// Replace with your friend's actual API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-friends-api.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const analyzeMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/predict', formData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default { analyzeMedia };