import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      step: '1',
      title: 'Describe Your Project',
      description: 'Tell us about your vision, budget, and timeline',
      icon: 'fas fa-lightbulb'
    },
    {
      step: '2',
      title: 'Get Matched',
      description: 'We connect you with qualified architects',
      icon: 'fas fa-handshake'
    },
    {
      step: '3',
      title: 'Collaborate & Build',
      description: 'Work together to bring your project to life',
      icon: 'fas fa-rocket'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to your dream project</p>
        </div>

        <div className="steps-container">
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className={`step-wrapper step-${index + 1}`}>
                <div className="step-card">
                  <div className="step-number">{step.step}</div>
                  <div className="step-icon">
                    <i className={step.icon}></i>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Innovative curved connections */}
          <div className="connections-overlay">
            <svg className="connection-svg" viewBox="0 0 800 300" preserveAspectRatio="none">
              {/* First connection curve */}
              <path 
                className="connection-path path-1" 
                d="M 150 150 Q 300 50 450 150" 
                stroke="url(#gradient1)" 
                strokeWidth="3" 
                fill="none"
                strokeDasharray="8,4"
              />
              {/* Second connection curve */}
              <path 
                className="connection-path path-2" 
                d="M 450 150 Q 600 250 750 150" 
                stroke="url(#gradient2)" 
                strokeWidth="3" 
                fill="none"
                strokeDasharray="8,4"
              />
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.8"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="var(--secondary-color)" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              
              {/* Animated particles */}
              <circle className="particle particle-1" cx="0" cy="0" r="4" fill="var(--accent-color)">
                <animateMotion dur="3s" repeatCount="indefinite">
                  <mpath href="#path1"/>
                </animateMotion>
              </circle>
              <circle className="particle particle-2" cx="0" cy="0" r="4" fill="var(--primary-color)">
                <animateMotion dur="3s" repeatCount="indefinite" begin="0.5s">
                  <mpath href="#path2"/>
                </animateMotion>
              </circle>
            </svg>
          </div>
        </div>

        <div className="cta-section">
          <Link to="/signup" className="btn btn-primary btn-large">
            Get Started Today
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;