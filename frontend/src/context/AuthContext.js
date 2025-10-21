import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('buildbuddy_token');
        const storedUser = localStorage.getItem('buildbuddy_user');
        const storedSession = sessionStorage.getItem('buildbuddy_session');
        const navigationFlag = sessionStorage.getItem('buildbuddy_navigation');

        console.log('Auth initialization:', { 
          hasToken: !!storedToken, 
          hasUser: !!storedUser, 
          sessionActive: storedSession,
          navigationFlag 
        });

        // Check if this is a back navigation after login
        if (navigationFlag === 'back_navigation' && storedToken && storedUser) {
          console.log('Back navigation detected, logging out user');
          // Clear all auth data
          localStorage.removeItem('buildbuddy_token');
          localStorage.removeItem('buildbuddy_user');
          sessionStorage.removeItem('buildbuddy_session');
          sessionStorage.removeItem('buildbuddy_navigation');
          sessionStorage.removeItem('buildbuddy_login_timestamp');
          setUser(null);
          setToken(null);
          setSessionActive(false);
          return;
        }

        if (storedToken && storedUser) {
          // If we have token and user, restore the session
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setSessionActive(true);
          
          // Ensure session storage is set
          if (storedSession !== 'active') {
            sessionStorage.setItem('buildbuddy_session', 'active');
          }
          
          console.log('Auth restored from localStorage');
        } else {
          console.log('No valid auth data found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('buildbuddy_token');
        localStorage.removeItem('buildbuddy_user');
        sessionStorage.removeItem('buildbuddy_session');
        sessionStorage.removeItem('buildbuddy_navigation');
        sessionStorage.removeItem('buildbuddy_login_timestamp');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes (when user logs out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'buildbuddy_token' && !e.newValue) {
        // Token was removed, log out
        setUser(null);
        setToken(null);
        setSessionActive(false);
      }
    };

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check if session is still valid
        const currentSession = sessionStorage.getItem('buildbuddy_session');
        const currentToken = localStorage.getItem('buildbuddy_token');
        
        if (!currentSession || !currentToken) {
          setUser(null);
          setToken(null);
          setSessionActive(false);
        }
      }
    };

    // Listen for browser back/forward navigation
    const handlePopState = () => {
      const currentUser = localStorage.getItem('buildbuddy_user');
      const loginTimestamp = sessionStorage.getItem('buildbuddy_login_timestamp');
      
      // If user is logged in and this is a popstate event (back/forward navigation)
      if (currentUser && loginTimestamp) {
        console.log('Browser navigation detected, marking for logout');
        // Set flag for back navigation
        sessionStorage.setItem('buildbuddy_navigation', 'back_navigation');
        
        // Force logout immediately
        setUser(null);
        setToken(null);
        setSessionActive(false);
        localStorage.removeItem('buildbuddy_token');
        localStorage.removeItem('buildbuddy_user');
        sessionStorage.removeItem('buildbuddy_session');
        sessionStorage.removeItem('buildbuddy_login_timestamp');
        
        // Redirect to home page
        window.location.href = '/';
      }
    };

    // Listen for beforeunload to detect when user is leaving
    const handleBeforeUnload = () => {
      const currentUser = localStorage.getItem('buildbuddy_user');
      if (currentUser) {
        // Set a flag that we're navigating away
        sessionStorage.setItem('buildbuddy_navigation', 'page_unload');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Login function
  const login = (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      setSessionActive(true);
      localStorage.setItem('buildbuddy_token', authToken);
      localStorage.setItem('buildbuddy_user', JSON.stringify(userData));
      sessionStorage.setItem('buildbuddy_session', 'active');
      sessionStorage.setItem('buildbuddy_login_timestamp', Date.now().toString());
      
      // Clear any previous navigation flags
      sessionStorage.removeItem('buildbuddy_navigation');
      
      console.log('User logged in successfully with navigation tracking');
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save login data');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionActive(false);
    localStorage.removeItem('buildbuddy_token');
    localStorage.removeItem('buildbuddy_user');
    sessionStorage.removeItem('buildbuddy_session');
    sessionStorage.removeItem('buildbuddy_navigation');
    sessionStorage.removeItem('buildbuddy_login_timestamp');
    console.log('User logged out and navigation tracking cleared');
    // Redirect to home page
    window.location.href = '/';
  };

  // Clear session (called when visiting landing page)
  const clearSession = () => {
    setSessionActive(false);
    sessionStorage.removeItem('buildbuddy_session');
    sessionStorage.removeItem('buildbuddy_navigation');
    sessionStorage.removeItem('buildbuddy_login_timestamp');
    // Also clear the user state to force logout
    setUser(null);
    setToken(null);
    localStorage.removeItem('buildbuddy_token');
    localStorage.removeItem('buildbuddy_user');
    console.log('Session cleared completely');
  };

  // Update user profile
  const updateUser = (updatedUserData) => {
    try {
      const newUser = { ...user, ...updatedUserData };
      setUser(newUser);
      localStorage.setItem('buildbuddy_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user data');
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(user && token && sessionActive);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.userType === role;
  };

  // API call helper with authentication
  const authenticatedFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    sessionActive,
    login,
    logout,
    clearSession,
    updateUser,
    isAuthenticated,
    hasRole,
    authenticatedFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;