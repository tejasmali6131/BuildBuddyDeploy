import React, { useState, useEffect } from 'react';
import api from '../data/api';
import '../styles/Features.css';

const Features = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default features in case API fails
  const defaultFeatures = [
    {
      icon: 'fas fa-zap',
      title: 'Instant Matching',
      description: 'Get connected with qualified architects in under 24 hours based on your project needs.'
    },
    {
      icon: 'fa fa-heart',
      title: 'Verified Experts',
      description: 'All architects are professionally verified with credentials and portfolio reviews.'
    },
    {
      icon: 'fas fa-comments',
      title: 'Easy Communication',
      description: 'Built-in messaging and collaboration tools to keep your project on track.'
    },
    {
      icon: 'fas fa-lock',
      title: 'Secure Process',
      description: 'Protected payments and clear contracts ensure peace of mind for everyone.'
    }
  ];

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await api.getFeatures();
        setFeatures(data.length > 0 ? data : defaultFeatures);
      } catch (error) {
        console.error('Failed to fetch features:', error);
        setFeatures(defaultFeatures);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  if (loading) {
    return (
      <section id="features" className="features">
        <div className="container">
          <div className="loading">Loading features...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2>Why Choose BuildBuddy?</h2>
          <p>Everything you need for successful architectural collaboration</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card feature-${index}`}>
              <div className="feature-icon">
                {index === 1 ? (
                  <i className="fas fa-user"></i>
                ) : (
                  <i className={feature.icon}></i>
                )}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;