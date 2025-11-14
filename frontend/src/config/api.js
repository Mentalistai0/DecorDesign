// API Configuration
// In production (Vercel), use relative URLs since backend is served via /api rewrites
// In development, use localhost:3000

const isDevelopment = import.meta.env.DEV;
const configuredUrl = import.meta.env.VITE_API_URL;

// Use configured URL if provided, otherwise use relative URLs in production
// and localhost in development
export const API_URL = configuredUrl || (isDevelopment ? 'http://localhost:3000' : '');

export default API_URL;
