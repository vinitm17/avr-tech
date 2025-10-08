import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/backend/v1/auth', // Backend auth routes
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

export default instance;
