import React, { useState } from 'react';
import '../../styles/PDFViewer.css';

const PDFViewer = ({ pdfUrl, filename, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  console.log('PDFViewer - URL:', pdfUrl);
  console.log('PDFViewer - Filename:', filename);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <h3>Portfolio Document</h3>
          <div className="pdf-viewer-controls">
            <button 
              className="pdf-btn pdf-btn-secondary"
              onClick={handleOpenNewTab}
              title="Open in new tab"
            >
              <i className="fas fa-external-link-alt"></i>
            </button>
            <button 
              className="pdf-btn pdf-btn-close"
              onClick={onClose}
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <i className="fas fa-exclamation-triangle"></i>
              <h4>Unable to display PDF</h4>
              <p>This PDF cannot be displayed in the browser.</p>
              <div className="pdf-error-actions">
                <button 
                  className="pdf-btn pdf-btn-primary"
                  onClick={handleOpenNewTab}
                >
                  <i className="fas fa-external-link-alt"></i>
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          {!error && (
            <>
              <iframe
                src={pdfUrl}
                title="Portfolio PDF"
                className="pdf-iframe"
                onLoad={handleLoad}
                onError={handleError}
                style={{ display: loading ? 'none' : 'block' }}
              />
              
              {/* Fallback object tag for better browser support */}
              <object
                data={pdfUrl}
                type="application/pdf"
                className="pdf-object"
                style={{ display: 'none' }}
              >
                <div className="pdf-fallback">
                  <i className="fas fa-file-pdf"></i>
                  <h4>PDF Preview Not Available</h4>
                  <p>Your browser doesn't support PDF preview.</p>
                  <div className="pdf-fallback-actions">
                    <button 
                      className="pdf-btn pdf-btn-primary"
                      onClick={handleOpenNewTab}
                    >
                      <i className="fas fa-external-link-alt"></i>
                      Open in New Tab
                    </button>
                  </div>
                </div>
              </object>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;