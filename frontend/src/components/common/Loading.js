import React from 'react';
import './Loading.css';

const Loading = ({ 
  message = 'Loading...', 
  fullScreen = false, 
  overlay = false,
  size = 'medium',
  type = 'spinner'
}) => {
  const containerClass = `loading-container ${fullScreen ? 'fullscreen' : ''} ${overlay ? 'overlay' : ''}`;
  const spinnerClass = `loading-spinner ${size}`;

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      case 'pulse':
        return <div className="loading-pulse"></div>;
      case 'bars':
        return (
          <div className="loading-bars">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        );
      case 'buildbuddy':
        return (
          <div className="loading-buildbuddy">
            <div className="building-blocks">
              <div className="block block-1"></div>
              <div className="block block-2"></div>
              <div className="block block-3"></div>
            </div>
            <div className="construction-line"></div>
          </div>
        );
      default:
        return <div className="loading-spinner-circle"></div>;
    }
  };

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={spinnerClass}>
          {renderSpinner()}
        </div>
        {message && <div className="loading-message">{message}</div>}
      </div>
    </div>
  );
};

export default Loading;