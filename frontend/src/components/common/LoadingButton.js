import React from 'react';
import './LoadingButton.css';

const LoadingButton = ({ 
  loading = false,
  children,
  loadingText = "Loading...",
  icon = null,
  loadingIcon = "spinner",
  className = "",
  type = "button",
  disabled = false,
  onClick = null,
  ...props 
}) => {
  const buttonClass = `loading-btn ${className} ${loading ? 'is-loading' : ''}`;
  
  const renderLoadingIcon = () => {
    switch (loadingIcon) {
      case 'dots':
        return (
          <div className="btn-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        );
      case 'pulse':
        return <div className="btn-loading-pulse"></div>;
      case 'bars':
        return (
          <div className="btn-loading-bars">
            <span></span>
            <span></span>
            <span></span>
          </div>
        );
      default:
        return <i className="fas fa-spinner fa-spin btn-loading-spinner"></i>;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <span className="btn-loading-content">
          {renderLoadingIcon()}
          <span className="btn-loading-text">{loadingText}</span>
        </span>
      );
    }

    return (
      <span className="btn-normal-content">
        {icon && <i className={`fas fa-${icon} btn-icon`}></i>}
        <span className="btn-text">{children}</span>
      </span>
    );
  };

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default LoadingButton;