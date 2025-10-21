import React from 'react';
import './PortfolioSkeleton.css';

const PortfolioSkeleton = ({ type = 'grid', count = 3 }) => {
  if (type === 'grid') {
    return (
      <div className="portfolio-skeleton-container">
        <div className="portfolio-skeleton-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-button"></div>
        </div>
        
        <div className="portfolio-skeleton-grid">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="portfolio-skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton-card-title"></div>
                <div className="skeleton-card-actions">
                  <div className="skeleton-action-btn"></div>
                  <div className="skeleton-action-btn"></div>
                </div>
              </div>
              
              <div className="skeleton-card-content">
                <div className="skeleton-text-line skeleton-text-long"></div>
                <div className="skeleton-text-line skeleton-text-medium"></div>
                <div className="skeleton-text-line skeleton-text-short"></div>
              </div>
              
              <div className="skeleton-card-details">
                <div className="skeleton-detail-item"></div>
                <div className="skeleton-detail-item"></div>
              </div>
              
              <div className="skeleton-card-links">
                <div className="skeleton-link"></div>
                <div className="skeleton-link"></div>
              </div>
              
              <div className="skeleton-card-footer">
                <div className="skeleton-footer-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'modal') {
    return (
      <div className="portfolio-modal-skeleton">
        <div className="skeleton-modal-overlay">
          <div className="skeleton-modal-content">
            <div className="skeleton-modal-header">
              <div className="skeleton-modal-title"></div>
              <div className="skeleton-modal-close"></div>
            </div>
            
            <div className="skeleton-modal-body">
              <div className="skeleton-form-row">
                <div className="skeleton-form-group">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-input"></div>
                </div>
                <div className="skeleton-form-group">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-input"></div>
                </div>
              </div>
              
              <div className="skeleton-form-group">
                <div className="skeleton-label"></div>
                <div className="skeleton-textarea"></div>
              </div>
              
              <div className="skeleton-form-row">
                <div className="skeleton-form-group">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-input"></div>
                </div>
                <div className="skeleton-form-group">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-input"></div>
                </div>
              </div>
            </div>
            
            <div className="skeleton-modal-actions">
              <div className="skeleton-modal-btn"></div>
              <div className="skeleton-modal-btn"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'operation') {
    return (
      <div className="portfolio-operation-skeleton">
        <div className="skeleton-operation-content">
          <div className="skeleton-operation-icon">
            <div className="skeleton-spinner"></div>
          </div>
          <div className="skeleton-operation-text"></div>
          <div className="skeleton-operation-subtext"></div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default PortfolioSkeleton;