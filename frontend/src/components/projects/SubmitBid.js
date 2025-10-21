import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastProvider';
import { scrollToTop } from '../ScrollToTop';
import './Projects.css';

const SubmitBid = ({ project, onBidSubmitted, onCancel }) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [bidData, setBidData] = useState({
    bid_amount: '',
    estimated_duration: '',
    proposal_description: '',
    experience_note: '',
    portfolio_samples: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop();
  }, []);

  // Add null check for project
  if (!project) {
    return (
      <div className="submit-bid-container">
        <div className="loading">Loading project details...</div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBidData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!bidData.bid_amount || bidData.bid_amount <= 0) {
      newErrors.bid_amount = 'Bid amount must be greater than 0';
    }

    // Check if bid amount is within project budget range
    if (bidData.bid_amount && project && project.budget_min && project.budget_max &&
        (parseInt(bidData.bid_amount) < project.budget_min || 
         parseInt(bidData.bid_amount) > project.budget_max)) {
      newErrors.bid_amount = `Bid amount should be between ₹${project.budget_min.toLocaleString('en-IN')} and ₹${project.budget_max.toLocaleString('en-IN')}`;
    }

    if (!bidData.estimated_duration.trim()) {
      newErrors.estimated_duration = 'Estimated duration is required';
    }

    if (!bidData.proposal_description.trim()) {
      newErrors.proposal_description = 'Proposal description is required';
    } else if (bidData.proposal_description.trim().length < 100) {
      newErrors.proposal_description = 'Proposal description should be at least 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...bidData,
          project_id: project?.id,
          bid_amount: parseInt(bidData.bid_amount)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      console.log('Bid submission response:', { status: response.status, ok: response.ok, data });

      if (response.ok) {
        showSuccess('Bid submitted successfully!');
        onBidSubmitted && onBidSubmitted(data.bid);
        // Close form immediately after successful submission
        onCancel && onCancel();
      } else {
        console.error('Bid submission failed:', data);
        showError(`Error: ${data.message || data.error || 'Failed to submit bid'}`);
      }
    } catch (error) {
      console.error('Error submitting bid:', error);
      if (error.name === 'AbortError') {
        showError('Request timed out. Please check if the backend server is running and try again.');
      } else if (error.message.includes('fetch')) {
        showError('Unable to connect to server. Please ensure the backend is running on port 5000.');
      } else {
        showError('Failed to submit bid. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="submit-bid-container">
      <div className="submit-bid-header">
        <h2>Submit Bid for "{project?.title || 'Project'}"</h2>
        <button className="cancel-button" onClick={onCancel}>✕</button>
      </div>

      {/* Project Summary */}
      <div className="project-summary">
        <h3>Project Summary</h3>
        <div className="summary-details">
          <div className="summary-item">
            <span className="summary-label">Type:</span>
            <span className="summary-value">{project?.project_type || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Location:</span>
            <span className="summary-value">{project?.location || 'N/A'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Budget Range:</span>
            <span className="summary-value">
              {project?.budget_min && project?.budget_max 
                ? `${formatBudget(project.budget_min)} - ${formatBudget(project.budget_max)}`
                : 'N/A'
              }
            </span>
          </div>
          {project?.area_sqft && (
            <div className="summary-item">
              <span className="summary-label">Area:</span>
              <span className="summary-value">{project.area_sqft} sq ft</span>
            </div>
          )}
          {project?.timeline && (
            <div className="summary-item">
              <span className="summary-label">Expected Timeline:</span>
              <span className="summary-value">{project.timeline}</span>
            </div>
          )}
        </div>
        <div className="project-description">
          <p><strong>Description:</strong> {project?.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Bid Form */}
      <form onSubmit={handleSubmit} className="submit-bid-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bid_amount">Your Bid Amount (₹) *</label>
            <input
              type="number"
              id="bid_amount"
              name="bid_amount"
              value={bidData.bid_amount}
              onChange={handleInputChange}
              placeholder={project?.budget_min && project?.budget_max 
                ? `Between ₹${project.budget_min.toLocaleString('en-IN')} - ₹${project.budget_max.toLocaleString('en-IN')}`
                : 'Enter your bid amount'
              }
              min={project?.budget_min || 1}
              max={project?.budget_max || 999999999}
              className={errors.bid_amount ? 'error' : ''}
            />
            {errors.bid_amount && <span className="error-message">{errors.bid_amount}</span>}
            <small className="hint">
              {project?.budget_min && project?.budget_max 
                ? `Budget range: ${formatBudget(project.budget_min)} - ${formatBudget(project.budget_max)}`
                : 'Budget range will be displayed when project data loads'
              }
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="estimated_duration">Estimated Duration *</label>
            <input
              type="text"
              id="estimated_duration"
              name="estimated_duration"
              value={bidData.estimated_duration}
              onChange={handleInputChange}
              placeholder="e.g., 4 months, 6-8 weeks"
              className={errors.estimated_duration ? 'error' : ''}
            />
            {errors.estimated_duration && <span className="error-message">{errors.estimated_duration}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="proposal_description">Proposal Description *</label>
          <textarea
            id="proposal_description"
            name="proposal_description"
            value={bidData.proposal_description}
            onChange={handleInputChange}
            placeholder="Describe your approach to this project, what you will deliver, your methodology, and why you're the right choice for this project..."
            rows="6"
            className={errors.proposal_description ? 'error' : ''}
          />
          {errors.proposal_description && <span className="error-message">{errors.proposal_description}</span>}
          <small className="hint">
            Minimum 100 characters. Current: {bidData.proposal_description.length}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="experience_note">Relevant Experience & Approach</label>
          <textarea
            id="experience_note"
            name="experience_note"
            value={bidData.experience_note}
            onChange={handleInputChange}
            placeholder="Share your relevant experience with similar projects, your unique approach, certifications, or any special advantages you bring to this project..."
            rows="4"
          />
          <small className="hint">
            Optional: Highlight your relevant experience and what makes your approach unique
          </small>
        </div>

        <div className="bid-tips">
          <h4>💡 Tips for a Winning Bid</h4>
          <ul>
            <li>Be realistic with your timeline and budget</li>
            <li>Clearly explain your approach and methodology</li>
            <li>Highlight relevant experience and past projects</li>
            <li>Show understanding of the client's specific requirements</li>
            <li>Be professional and detailed in your proposal</li>
          </ul>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Submitting...' : 'Submit Bid'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitBid;