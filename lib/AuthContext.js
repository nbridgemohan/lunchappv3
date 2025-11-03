'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');

    if (storedToken && storedUser && sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp);

      if (sessionAge > SESSION_TIMEOUT) {
        // Session expired
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionTimestamp');
        setSessionExpired(true);
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // Monitor session activity and auto-logout on timeout
  useEffect(() => {
    if (!token || !user) return;

    const checkSessionExpiry = () => {
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      if (sessionTimestamp) {
        const sessionAge = Date.now() - parseInt(sessionTimestamp);

        if (sessionAge > SESSION_TIMEOUT) {
          logoutDueToTimeout();
        }
      }
    };

    // Check session every minute
    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [token, user]);

  const logoutDueToTimeout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionExpired(true);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setSessionExpired(false);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('sessionTimestamp', Date.now().toString());
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionExpired(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
