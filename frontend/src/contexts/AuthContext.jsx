import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [credits, setCredits] = useState({
    image: { total: 0, used: 0, available: 0 },
    video: { total: 0, used: 0, available: 0 },
  });

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch user credits
  const fetchCredits = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/credits`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCredits(response.data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      // Initialize with zeros if fetch fails
      setCredits({
        image: { total: 0, used: 0, available: 0 },
        video: { total: 0, used: 0, available: 0 },
      });
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.data.success) {
          setUser(response.data.user);
          setToken(storedToken);

          // Fetch user credits after authentication
          await fetchCredits();
        } else {
          // Token is invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (email, password, name) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email,
        password,
        name
      });

      if (response.data.success) {
        const { user: newUser, session } = response.data;

        // Store tokens
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);

        // Update state
        setUser(newUser);
        setToken(session.access_token);

        // Fetch user credits
        await fetchCredits();

        return { success: true, user: newUser };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create account'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { user: loggedInUser, session } = response.data;

        // Store tokens
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);

        // Update state
        setUser(loggedInUser);
        setToken(session.access_token);

        // Fetch user credits
        await fetchCredits();

        return { success: true, user: loggedInUser };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to log in'
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setToken(null);
      setCredits({
        image: { total: 0, used: 0, available: 0 },
        video: { total: 0, used: 0, available: 0 },
      });
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refresh_token: storedRefreshToken
      });

      if (response.data.success) {
        const { session } = response.data;

        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);

        setToken(session.access_token);

        return { success: true };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log out
      await logout();
      return { success: false };
    }
  };

  // Setup axios interceptor for token refresh on 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const result = await refreshToken();

          if (result.success) {
            // Retry the original request with new token
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    credits,
    signup,
    login,
    logout,
    refreshToken,
    refreshCredits: fetchCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
