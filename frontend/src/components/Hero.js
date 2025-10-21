import React, { useState, useEffect } from 'react';
import BungalowModel from './BungalowModel';
import { Link } from 'react-router-dom';
import '../styles/Hero.css';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleStartProject = () => {
    // Add interactive feedback
    const button = document.querySelector('.btn-primary');
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }
  };

  const handleGenerateCustomPlan = () => {
    setShowFeaturePopup(true);
  };

  return (
    <section className="hero">
      <div className="container">
        <div className={`hero-content ${isVisible ? 'animate' : ''}`}>
          <div className="hero-text">
            <h1 className="hero-title">
              Build Your <span className="highlight">Dream</span> with Expert Architects
            </h1>
            <p className="hero-description">
              Connect with certified architects instantly. From concept to completion, 
              we make architectural collaboration simple, secure, and successful.
            </p>
            
            <div className="hero-cta">
              <Link 
                to="/signup"
                className="btn btn-primary btn-large hero-btn"
                onClick={handleStartProject}
              >
                <i className="fas fa-rocket"></i>
                Start Your Project
              </Link>
              <button className="btn btn-secondary btn-large hero-btn">
                <i className="fas fa-play"></i>
                Watch Demo
              </button>
            </div>
          </div>
          
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
                    {/* <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div> */}
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
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="floating-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
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
    </section>
  );
};

export default Hero;