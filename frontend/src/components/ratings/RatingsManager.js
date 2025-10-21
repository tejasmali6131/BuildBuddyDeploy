import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ToastContainer from '../common/ToastContainer';
import { ComponentLoading, SmallLoading } from '../common/LoadingVariants';
import LoadingButton from '../common/LoadingButton';
import useToast from '../../hooks/useToast';
import { API_BASE_URL_EXPORT } from '../../data/api';
import '../../styles/Ratings.css';

const RatingsManager = () => {
  const { token, user } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({});
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [markingComplete, setMarkingComplete] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch ratings data
  const fetchRatings = async () => {
    if (!token) return;

    try {
      setLoadingRatings(true);
      if (initialLoad) setLoading(true);
      
      const response = await fetch(`${API_BASE_URL_EXPORT}/ratings/my-ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setSummary(data.summary || {});
      } else {
        throw new Error('Failed to fetch ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      showError('Failed to load ratings data');
    } finally {
      setLoadingRatings(false);
    }
  };

  // Fetch completed projects
  const fetchCompletedProjects = async () => {
    if (!token) return;

    try {
      setLoadingProjects(true);
      if (initialLoad) setLoading(true);
      
      const response = await fetch(`${API_BASE_URL_EXPORT}/ratings/completed-projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompletedProjects(data.projects || []);
      } else {
        throw new Error('Failed to fetch completed projects');
      }
    } catch (error) {
      console.error('Error fetching completed projects:', error);
      showError('Failed to load completed projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Mark project as completed
  const markProjectCompleted = async (projectId, customerId, completionNotes = '') => {
    if (!token) return;

    try {
      setMarkingComplete(prev => ({ ...prev, [projectId]: true }));
      
      const response = await fetch(`${API_BASE_URL_EXPORT}/ratings/complete-project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          customer_id: customerId,
          completion_notes: completionNotes
        })
      });

      if (response.ok) {
        showSuccess('Project marked as completed! Customer will be notified to provide rating.');
        await fetchCompletedProjects();
      } else {
        throw new Error('Failed to mark project as completed');
      }
    } catch (error) {
      console.error('Error marking project completed:', error);
      showError('Failed to mark project as completed');
    } finally {
      setMarkingComplete(prev => ({ ...prev, [projectId]: false }));
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;
      
      setInitialLoad(true);
      setLoading(true);
      
      try {
        await Promise.all([
          fetchRatings(),
          fetchCompletedProjects()
        ]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadInitialData();
  }, [token]);

  const renderStarRating = (rating, size = 'medium') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<i key={i} className={`fas fa-star star-filled ${size}`}></i>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<i key={i} className={`fas fa-star-half-alt star-filled ${size}`}></i>);
      } else {
        stars.push(<i key={i} className={`far fa-star star-empty ${size}`}></i>);
      }
    }
    return stars;
  };

  const renderRatingsOverview = () => {
    if (loadingRatings && !initialLoad) {
      return <SmallLoading message="Loading ratings overview..." />;
    }
    
    return (
      <div className="ratings-overview">
        <div className="ratings-summary-card">
          <div className="summary-header">
            <h3>Your Ratings Overview</h3>
            <div className="overall-rating">
            <div className="rating-display">
              <span className="rating-number">{summary.average_rating || '0.0'}</span>
              <div className="rating-stars">
                {renderStarRating(parseFloat(summary.average_rating || 0), 'large')}
              </div>
            </div>
            <p className="total-reviews">Based on {summary.total_ratings || 0} reviews</p>
          </div>
        </div>

        <div className="rating-breakdown">
          <div className="breakdown-item">
            <span className="category">Communication</span>
            <div className="rating-bar">
              <div className="rating-stars-small">
                {renderStarRating(parseFloat(summary.avg_communication || 0), 'small')}
              </div>
              <span className="rating-value">{summary.avg_communication || '0.0'}</span>
            </div>
          </div>
          <div className="breakdown-item">
            <span className="category">Design Quality</span>
            <div className="rating-bar">
              <div className="rating-stars-small">
                {renderStarRating(parseFloat(summary.avg_design_quality || 0), 'small')}
              </div>
              <span className="rating-value">{summary.avg_design_quality || '0.0'}</span>
            </div>
          </div>
          <div className="breakdown-item">
            <span className="category">Timeliness</span>
            <div className="rating-bar">
              <div className="rating-stars-small">
                {renderStarRating(parseFloat(summary.avg_timeliness || 0), 'small')}
              </div>
              <span className="rating-value">{summary.avg_timeliness || '0.0'}</span>
            </div>
          </div>
          <div className="breakdown-item">
            <span className="category">Value for Money</span>
            <div className="rating-bar">
              <div className="rating-stars-small">
                {renderStarRating(parseFloat(summary.avg_value || 0), 'small')}
              </div>
              <span className="rating-value">{summary.avg_value || '0.0'}</span>
            </div>
          </div>
        </div>

        <div className="additional-stats">
          <div className="stat-item">
            <i className="fas fa-thumbs-up"></i>
            <span className="stat-value">{summary.recommendation_percentage || 0}%</span>
            <span className="stat-label">Would Recommend</span>
          </div>
          <div className="stat-item">
            <i className="fas fa-trophy"></i>
            <span className="stat-value">{summary.five_star || 0}</span>
            <span className="stat-label">5-Star Reviews</span>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderReviews = () => {
    if (loadingRatings && !initialLoad) {
      return <SmallLoading message="Loading customer reviews..." />;
    }
    
    return (
      <div className="reviews-section">
        <h3>Customer Reviews</h3>
        {ratings.length === 0 ? (
        <div className="no-reviews">
          <i className="fas fa-comment-slash"></i>
          <p>No reviews yet. Complete more projects to receive ratings!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {ratings.map((rating) => (
            <div key={rating.id} className="review-card">
              <div className="review-header">
                <div className="customer-info">
                  <h4>{rating.customer_first_name} {rating.customer_last_name}</h4>
                  <p className="project-title">{rating.project_title}</p>
                  <p className="project-location">{rating.project_location}</p>
                </div>
                <div className="rating-info">
                  <div className="rating-stars">
                    {renderStarRating(rating.rating)}
                  </div>
                  <span className="rating-date">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {rating.review_text && (
                <div className="review-text">
                  <p>"{rating.review_text}"</p>
                </div>
              )}
              <div className="detailed-ratings">
                {rating.communication_rating && (
                  <div className="detail-rating">
                    <span>Communication:</span>
                    <div className="rating-stars-small">
                      {renderStarRating(rating.communication_rating, 'small')}
                    </div>
                  </div>
                )}
                {rating.design_quality_rating && (
                  <div className="detail-rating">
                    <span>Design Quality:</span>
                    <div className="rating-stars-small">
                      {renderStarRating(rating.design_quality_rating, 'small')}
                    </div>
                  </div>
                )}
                {rating.timeliness_rating && (
                  <div className="detail-rating">
                    <span>Timeliness:</span>
                    <div className="rating-stars-small">
                      {renderStarRating(rating.timeliness_rating, 'small')}
                    </div>
                  </div>
                )}
                {rating.value_rating && (
                  <div className="detail-rating">
                    <span>Value:</span>
                    <div className="rating-stars-small">
                      {renderStarRating(rating.value_rating, 'small')}
                    </div>
                  </div>
                )}
              </div>
              {rating.would_recommend && (
                <div className="recommendation">
                  <i className="fas fa-thumbs-up"></i>
                  <span>Would recommend to others</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  const renderCompletedProjects = () => {
    if (loadingProjects && !initialLoad) {
      return <SmallLoading message="Loading completed projects..." />;
    }
    
    return (
      <div className="completed-projects-section">
      <h3>Completed Projects</h3>
      {completedProjects.length === 0 ? (
        <div className="no-projects">
          <i className="fas fa-clipboard-check"></i>
          <p>No completed projects yet.</p>
        </div>
      ) : (
        <div className="completed-projects-list">
          {completedProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h4>{project.project_title}</h4>
                <div className="project-status">
                  {project.rating_submitted ? (
                    <span className="status-badge rated">Rated</span>
                  ) : (
                    <span className="status-badge pending-rating">Pending Rating</span>
                  )}
                </div>
              </div>
              <div className="project-details">
                <p><i className="fas fa-map-marker-alt"></i> {project.project_location}</p>
                <p><i className="fas fa-user"></i> {project.customer_first_name} {project.customer_last_name}</p>
                <p><i className="fas fa-calendar-check"></i> Completed: {new Date(project.completion_date).toLocaleDateString()}</p>
                <p><i className="fas fa-rupee-sign"></i> ₹{project.bid_amount.toLocaleString()}</p>
              </div>
              {project.rating && (
                <div className="project-rating">
                  <div className="rating-display">
                    <div className="rating-stars">
                      {renderStarRating(project.rating)}
                    </div>
                    <span className="rating-text">({project.rating}/5)</span>
                  </div>
                  {project.review_text && (
                    <p className="review-preview">"{project.review_text}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  if (loading) {
    return (
      <div className="ratings-manager">
        <ComponentLoading message="Loading ratings and reviews..." />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="ratings-manager">
      <div className="ratings-header">
        <h2>
          <i className="fas fa-star"></i>
          Customer Ratings & Reviews
        </h2>
        <div className="ratings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-bar"></i>
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <i className="fas fa-comments"></i>
            Reviews ({ratings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <i className="fas fa-clipboard-check"></i>
            Completed Projects ({completedProjects.length})
          </button>
        </div>
      </div>

      <div className="ratings-content">
        {activeTab === 'overview' && renderRatingsOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'completed' && renderCompletedProjects()}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default RatingsManager;