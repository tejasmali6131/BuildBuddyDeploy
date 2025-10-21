import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthDebugger = () => {
  const { user, token, isAuthenticated, hasRole } = useAuth();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug</h4>
      <p><strong>Authenticated:</strong> {isAuthenticated() ? 'Yes' : 'No'}</p>
      <p><strong>Has Token:</strong> {!!token ? 'Yes' : 'No'}</p>
      <p><strong>User Type:</strong> {user?.userType || 'Not set'}</p>
      <p><strong>Is Architect:</strong> {hasRole('architect') ? 'Yes' : 'No'}</p>
      <p><strong>User ID:</strong> {user?.id || 'Not set'}</p>
      <p><strong>User Email:</strong> {user?.email || 'Not set'}</p>
      {user && (
        <details>
          <summary>Full User Object</summary>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default AuthDebugger;