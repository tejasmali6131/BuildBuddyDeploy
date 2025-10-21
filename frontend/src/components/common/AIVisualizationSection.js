import React, { useState } from 'react';
import BungalowModel from '../BungalowModel';
import '../../styles/Hero.css'; // Import the Hero styles for AI visual styling
import '../../styles/AIVisualizationSection.css'; // Import specific dashboard styles

const AIVisualizationSection = () => {
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);

  const handleGenerateCustomPlan = () => {
    setShowFeaturePopup(true);
  };

  return (
    <div className="ai-visualization-section">
      <div className="hero-visual">
        <div className="hero-card glass-card ai-demo-card">
          <div className="card-icon">
            <i className="fas fa-cube"></i>
          </div>
          <h3>AI-Powered 3D Visualization</h3>
          <p>Experience your dream building with our advanced AI that generates interactive 3D floor plans and architectural models</p>
          
          <div className="ai-demo-container">
            <div className="demo-viewer">
              <div className="viewer-header">
                <span className="ai-badge">
                  <i className="fas fa-brain"></i>
                  Generating...
                </span>
              </div>
              
              <div className="demo-content">
                <div className="model-container">
                  <BungalowModel />
                </div>
              </div>
            </div>
            
            <button 
              className="generate-custom-btn"
              onClick={handleGenerateCustomPlan}
            >
              <i className="fas fa-wand-magic-sparkles"></i>
              Generate Your Custom Plan
            </button>
          </div>
        </div>
      </div>

      {/* Feature Coming Soon Popup */}
      {showFeaturePopup && (
        <div className="feature-popup-overlay" onClick={() => setShowFeaturePopup(false)}>
          <div className="feature-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>🚀 Coming Soon!</h3>
              <button 
                className="popup-close-btn"
                onClick={() => setShowFeaturePopup(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="popup-content">
              <div className="popup-icon">
                <i className="fas fa-magic"></i>
              </div>
              <p>
                Our AI-powered custom plan generator is currently under development. 
                This exciting feature will be available soon!
              </p>
              <p className="popup-subtext">
                Stay tuned for revolutionary AI-driven architectural planning tools.
              </p>
            </div>
            <div className="popup-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowFeaturePopup(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVisualizationSection;