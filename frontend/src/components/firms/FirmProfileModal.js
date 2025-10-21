import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import '../../styles/FirmProfileModal.css';

const FirmProfileModal = ({ isOpen, onClose, architectId, architectName, companyName }) => {
  const { token } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    firmInfo: null,
    ratings: [],
    ratingSummary: null,
    completedProjects: [],
    portfolio: []
  });

  // Debug logging
  console.log('FirmProfileModal props:', { architectId, architectName, companyName });

  useEffect(() => {
    if (isOpen && architectId) {
      setLoading(true);
      setActiveTab('overview');
      fetchProfileData();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setLoading(true);
      setActiveTab('overview');
      setProfileData({
        firmInfo: null,
        ratings: [],
        ratingSummary: null,
        completedProjects: [],
        portfolio: []
      });
    }
  }, [isOpen, architectId]);

  const fetchProfileData = async () => {
    setLoading(true);
    console.log('Fetching profile data for architect ID:', architectId);
    
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const [firmResponse, ratingsResponse, projectsResponse, portfolioResponse] = await Promise.all([
        fetch(`/api/architects/${architectId}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch(`/api/architects/${architectId}/ratings`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch(`/api/architects/${architectId}/completed-projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch(`/api/portfolio/architect/${architectId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);
      
      console.log('API Responses:', {
        firm: firmResponse.status,
        ratings: ratingsResponse.status,
        projects: projectsResponse.status,
        portfolio: portfolioResponse.status
      });

      const firmData = firmResponse.ok ? await firmResponse.json() : null;
      const ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : { ratings: [], summary: null };
      const projectsData = projectsResponse.ok ? await projectsResponse.json() : { projects: [] };
      const portfolioData = portfolioResponse.ok ? await portfolioResponse.json() : { portfolio: [] };

      // Debug logging
      console.log('Portfolio API Response:', {
        status: portfolioResponse.status,
        ok: portfolioResponse.ok,
        data: portfolioData
      });
      
      if (!portfolioResponse.ok) {
        console.error('Portfolio API failed:', await portfolioResponse.text());
      }

      setProfileData({
        firmInfo: firmData,
        ratings: ratingsData.ratings || [],
        ratingSummary: ratingsData.summary || null,
        completedProjects: projectsData.projects || [],
        portfolio: portfolioData.portfolio || []
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      
      if (error.name === 'AbortError') {
        showError('Request timed out. Please try again.');
      } else if (error.message.includes('Failed to fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        showError('Failed to load profile information. Please try again.');
      }
      
      // Set fallback data to prevent loading state from persisting
      setProfileData({
        firmInfo: null,
        ratings: [],
        ratingSummary: null,
        completedProjects: [],
        portfolio: []
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="firm-info-card">
        <h3>Firm Information</h3>
        {profileData.firmInfo ? (
          <div className="firm-details">
            <div className="detail-row">
              <span className="label">Company Name:</span>
              <span className="value">{profileData.firmInfo.company_name || companyName}</span>
            </div>
            <div className="detail-row">
              <span className="label">License Number:</span>
              <span className="value">{profileData.firmInfo.license_number || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Years of Experience:</span>
              <span className="value">{profileData.firmInfo.years_experience || 'Not specified'} years</span>
            </div>
            <div className="detail-row">
              <span className="label">Specialization:</span>
              <span className="value">{profileData.firmInfo.specialization || 'General Architecture'}</span>
            </div>
            {profileData.firmInfo.website && (
              <div className="detail-row">
                <span className="label">Website:</span>
                <span className="value">
                  <a href={profileData.firmInfo.website} target="_blank" rel="noopener noreferrer">
                    {profileData.firmInfo.website}
                  </a>
                </span>
              </div>
            )}
            {profileData.firmInfo.description && (
              <div className="detail-row full-width">
                <span className="label">About:</span>
                <p className="description">{profileData.firmInfo.description}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="no-info">Firm information not available</p>
        )}
      </div>

      <div className="ratings-summary-card">
        <h3>Overall Ratings</h3>
        {profileData.ratingSummary ? (
          <div className="rating-overview">
            <div className="overall-rating">
              <div className="rating-display">
                <span className="rating-number">{profileData.ratingSummary.average_rating || '0.0'}</span>
                <div className="rating-stars">
                  {renderStarRating(parseFloat(profileData.ratingSummary.average_rating || 0), 'large')}
                </div>
              </div>
              <p className="total-reviews">Based on {profileData.ratingSummary.total_ratings || 0} reviews</p>
            </div>

            <div className="rating-breakdown">
              <div className="breakdown-item">
                <span className="category">Communication</span>
                <div className="rating-bar">
                  <div className="rating-stars-small">
                    {renderStarRating(parseFloat(profileData.ratingSummary.avg_communication || 0), 'small')}
                  </div>
                  <span className="rating-value">{profileData.ratingSummary.avg_communication || '0.0'}</span>
                </div>
              </div>
              <div className="breakdown-item">
                <span className="category">Design Quality</span>
                <div className="rating-bar">
                  <div className="rating-stars-small">
                    {renderStarRating(parseFloat(profileData.ratingSummary.avg_design_quality || 0), 'small')}
                  </div>
                  <span className="rating-value">{profileData.ratingSummary.avg_design_quality || '0.0'}</span>
                </div>
              </div>
              <div className="breakdown-item">
                <span className="category">Timeliness</span>
                <div className="rating-bar">
                  <div className="rating-stars-small">
                    {renderStarRating(parseFloat(profileData.ratingSummary.avg_timeliness || 0), 'small')}
                  </div>
                  <span className="rating-value">{profileData.ratingSummary.avg_timeliness || '0.0'}</span>
                </div>
              </div>
              <div className="breakdown-item">
                <span className="category">Value for Money</span>
                <div className="rating-bar">
                  <div className="rating-stars-small">
                    {renderStarRating(parseFloat(profileData.ratingSummary.avg_value || 0), 'small')}
                  </div>
                  <span className="rating-value">{profileData.ratingSummary.avg_value || '0.0'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-ratings">No ratings available yet</p>
        )}
      </div>
    </div>
  );

  const renderRatings = () => (
    <div className="ratings-section">
      <h3>Customer Reviews ({profileData.ratings.length})</h3>
      {profileData.ratings.length === 0 ? (
        <div className="no-reviews">
          <i className="fas fa-comment-slash"></i>
          <p>No customer reviews yet</p>
        </div>
      ) : (
        <div className="reviews-list">
          {profileData.ratings.map((rating) => (
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
                    {formatDate(rating.created_at)}
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

  const renderProjects = () => (
    <div className="projects-section">
      <h3>Completed Projects ({profileData.completedProjects.length})</h3>
      {profileData.completedProjects.length === 0 ? (
        <div className="no-projects">
          <i className="fas fa-building"></i>
          <p>No completed projects on BuildBuddy yet</p>
        </div>
      ) : (
        <div className="projects-grid">
          {profileData.completedProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h4>{project.title}</h4>
                <span className="project-type">{project.project_type}</span>
              </div>
              <div className="project-details">
                <p><i className="fas fa-map-marker-alt"></i> {project.location}</p>
                <p><i className="fas fa-calendar-check"></i> Completed: {formatDate(project.completed_date)}</p>
                {project.area_sqft && (
                  <p><i className="fas fa-ruler"></i> {project.area_sqft} sq ft</p>
                )}
              </div>
              <p className="project-description">{project.description}</p>
              {project.rating && (
                <div className="project-rating">
                  <div className="rating-stars">
                    {renderStarRating(project.rating, 'small')}
                  </div>
                  <span className="rating-text">Rated {project.rating}/5</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleViewPDF = (portfolio) => {
    // Use direct backend URL like in architect dashboard
    const pdfUrl = `http://localhost:5000/api/portfolio/uploads/${portfolio.pdf_filename}`;
    console.log('Opening PDF via direct backend URL:', pdfUrl);
    
    // Open in new window/tab
    window.open(pdfUrl, '_blank');
  };

  const renderPortfolio = () => {
    if (!profileData?.portfolio || profileData.portfolio.length === 0) {
      return (
        <div className="portfolio-section">
          <h3>Portfolio (0)</h3>
          <div className="no-portfolio">
            <i className="fas fa-folder-open"></i>
            <p>No portfolio items available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="portfolio-section">
        <h3>Portfolio ({profileData.portfolio.length})</h3>
        <div className="portfolio-grid">
          {profileData.portfolio.map((item, index) => (
            <div key={item.id || index} className="portfolio-card">
              {item.image_urls && item.image_urls.length > 0 && (
                <div className="portfolio-image">
                  <img src={item.image_urls[0]} alt={item.title} />
                </div>
              )}
              <div className="portfolio-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <span className="project-type">{item.project_type}</span>
              </div>
              <div className="portfolio-links">
                {item.url && (
                  <a 
                    href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="portfolio-link"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    View Project
                  </a>
                )}
                {item.file_url && (
                  <button 
                    onClick={() => {
                      // Extract just the filename from the full path
                      const filename = item.file_url.split('/').pop();
                      const pdfUrl = `http://localhost:5000/api/portfolio/uploads/${filename}`;
                      console.log('Opening PDF with URL:', pdfUrl);
                      window.open(pdfUrl, '_blank');
                    }}
                    className="portfolio-link pdf-link"
                  >
                    <i className="fas fa-file-pdf"></i>
                    View PDF
                  </button>
                )}
              </div>
              <div className="portfolio-footer">
                <small>Created: {formatDate(item.created_at)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="firm-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>{architectName}'s Profile</h2>
            {companyName && <p className="company-subtitle">{companyName}</p>}
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-info-circle"></i>
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratings')}
            >
              <i className="fas fa-star"></i>
              Reviews ({profileData.ratings.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <i className="fas fa-building"></i>
              Projects ({profileData.completedProjects.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <i className="fas fa-folder"></i>
              Portfolio ({profileData.portfolio.length})
            </button>
          </div>

          <div className="profile-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'ratings' && renderRatings()}
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'portfolio' && renderPortfolio()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirmProfileModal;