import React, { useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastProvider';
import SubmitBid from './SubmitBid';
import RatingModal from '../ratings/RatingModal';
import FirmProfileModal from '../firms/FirmProfileModal';
import { scrollToTop } from '../ScrollToTop';
import { API_BASE_URL_EXPORT } from '../../data/api';
import './Projects.css';
import '../../styles/Ratings.css';

const ProjectDetails = ({ project, onBack, onProjectUpdated, initialShowBidForm = false }) => {
  const { token, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [projectData, setProjectData] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(initialShowBidForm);
  const [processingBid, setProcessingBid] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completingProject, setCompletingProject] = useState(null);
  const [showFirmProfile, setShowFirmProfile] = useState(false);
  const [selectedArchitect, setSelectedArchitect] = useState(null);
  const [architectRatings, setArchitectRatings] = useState({});
  const fetchingRef = useRef(false); // Use ref instead of state to avoid dependency issues

  useEffect(() => {
    fetchProjectDetails();
  }, [project.id, token]);

  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop();
  }, []);

  const fetchProjectDetails = async () => {
    if (fetchingRef.current) return; // Prevent duplicate requests
    
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL_EXPORT}/projects/${project.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProjectData(data.project);
        setBids(data.bids || []);
        
        // Fetch ratings for each architect in the bids (only for customers)
        if (user.userType === 'customer' && data.bids && data.bids.length > 0) {
          data.bids.forEach(bid => {
            if (bid.architect_id) {
              fetchArchitectRatings(bid.architect_id);
            }
          });
        }
      } else {
        console.error('Error fetching project details:', data.message);
        showError(`Failed to load project details: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      showError('Failed to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Fetch architect ratings for a specific architect
  const fetchArchitectRatings = async (architectId) => {
    if (architectRatings[architectId]) return; // Already fetched
    
    try {
      const response = await fetch(`${API_BASE_URL_EXPORT}/ratings/architect/${architectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setArchitectRatings(prev => ({
          ...prev,
          [architectId]: data.summary
        }));
      }
    } catch (error) {
      console.error('Error fetching architect ratings:', error);
    }
  };

  // Render star rating component
  const renderStarRating = (rating, size = 'small') => {
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

  const handleBidSubmitted = (newBid) => {
    setBids(prev => [newBid, ...prev]);
    setShowBidForm(false);
    // No need to refetch - we already have the new bid data
  };

  const handleBidDecision = async (bidId, status) => {
    setProcessingBid(bidId);
    
    try {
      const response = await fetch(`${API_BASE_URL_EXPORT}/bids/${bidId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (response.ok) {
        // Update bids list
        setBids(prev => prev.map(bid => 
          bid.id === bidId ? { ...bid, status } : bid
        ));
        
        // Update project status if bid was accepted
        if (status === 'accepted') {
          setProjectData(prev => ({ ...prev, status: 'in_progress' }));
          onProjectUpdated && onProjectUpdated({ ...projectData, status: 'in_progress' });
        }
        
        showSuccess(`Bid ${status} successfully!`);
      } else {
        showError(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error processing bid:', error);
      showError('Failed to process bid. Please try again.');
    } finally {
      setProcessingBid(null);
    }
  };

  const formatBudget = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      case 'pending': return '#6c757d';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getBidStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  // Handle project completion
  const handleMarkAsCompleted = (project) => {
    const acceptedBid = bids.find(bid => bid.status === 'accepted');
    if (!acceptedBid) {
      showError('No accepted architect found for this project');
      return;
    }

    // Use architect information from the accepted bid
    setCompletingProject({
      project,
      architect: {
        first_name: acceptedBid.architect_first_name || 'Unknown',
        last_name: acceptedBid.architect_last_name || 'Architect'
      }
    });
    setShowRatingModal(true);
  };

  // Handle rating submission
  const handleRatingSubmit = async (ratingData) => {
    try {
      const acceptedBid = bids.find(bid => bid.status === 'accepted');
      const architectId = acceptedBid?.architect_id;
      
      if (!architectId) {
        throw new Error('No accepted architect found for this project');
      }

      // First, mark project as completed
      const completionResponse = await fetch(`${API_BASE_URL_EXPORT}/ratings/complete-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: completingProject.project.id,
          architect_id: architectId,
          completion_notes: 'Marked as completed by customer'
        })
      });

      if (!completionResponse.ok) {
        throw new Error('Failed to mark project as completed');
      }

      // If rating data is provided, submit the rating
      if (ratingData) {
        const ratingResponse = await fetch(`${API_BASE_URL_EXPORT}/ratings/create`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            project_id: completingProject.project.id,
            architect_id: architectId,
            ...ratingData
          })
        });

        if (!ratingResponse.ok) {
          throw new Error('Failed to submit rating');
        }
      }

      // Update the project status in local state
      setProjectData(prev => ({ ...prev, status: 'completed' }));

      // Notify parent component if callback provided
      if (onProjectUpdated) {
        onProjectUpdated({ ...projectData, status: 'completed' });
      }

      setShowRatingModal(false);
      setCompletingProject(null);
      showSuccess('Project marked as completed successfully!');

      // Refresh project details
      await fetchProjectDetails();

    } catch (error) {
      console.error('Error completing project:', error);
      showError(error.message || 'Failed to complete project');
    }
  };

  // Handle project cancellation
  const handleCancelProject = async (project) => {
    const confirmed = window.confirm('Are you sure you want to cancel the project?');
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL_EXPORT}/projects/${project.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update the project status in local state
        setProjectData(prev => ({ ...prev, status: 'open' }));

        // Notify parent component if callback provided
        if (onProjectUpdated) {
          onProjectUpdated({ ...projectData, status: 'open' });
        }

        showSuccess('Project cancelled successfully! It has been reopened for new bids.');
        
        // Refresh project details
        await fetchProjectDetails();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel project');
      }
    } catch (error) {
      console.error('Error cancelling project:', error);
      showError(error.message || 'Failed to cancel project');
    }
  };

  // Check if current user has already bid
  const userBid = user.userType === 'architect' 
    ? bids.find(bid => bid.architect_id === user.id)
    : null;

  if (loading || !projectData) {
    return <div className="loading">Loading project details...</div>;
  }

  if (showBidForm) {
    // Make sure we have project data before showing the bid form
    if (!projectData) {
      return <div className="loading">Loading project details...</div>;
    }
    
    return (
      <SubmitBid
        project={projectData}
        onBidSubmitted={handleBidSubmitted}
        onCancel={() => setShowBidForm(false)}
      />
    );
  }

  return (
    <div className="project-details-container">
      <div className="project-details-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Projects
        </button>
        <div className="header-actions">
          {user.userType === 'architect' && projectData?.status === 'open' && !userBid && (
            <button 
              className="submit-bid-btn"
              onClick={() => setShowBidForm(true)}
            >
              Submit Bid
            </button>
          )}
          {user.userType === 'customer' && projectData?.status === 'in_progress' && bids.some(bid => bid.status === 'accepted') && (
            <>
              <button
                className="cancel-project-btn"
                onClick={() => handleCancelProject(projectData)}
              >
                <i className="fas fa-times-circle"></i>
                Cancel Project
              </button>
              <button
                className="complete-project-btn"
                onClick={() => handleMarkAsCompleted(projectData)}
              >
                <i className="fas fa-check-circle"></i>
                Mark as Completed
              </button>
            </>
          )}
        </div>
      </div>

      <div className="project-details-content">
        {/* Project Information */}
        <div className="project-info-section">
          <div className="project-header">
            <h1>{projectData?.title || 'Project Title'}</h1>
            <span 
              className="project-status-badge"
              style={{ backgroundColor: getStatusColor(projectData?.status || 'open') }}
            >
              {projectData?.status ? projectData.status.replace('_', ' ').toUpperCase() : 'OPEN'}
            </span>
          </div>

          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label">Type:</span>
              <span className="meta-value">{projectData?.project_type || 'Not specified'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Location:</span>
              <span className="meta-value">📍 {projectData?.location || 'Not specified'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Budget:</span>
              <span className="meta-value">
                {formatBudget(projectData?.budget_min || 0)} - {formatBudget(projectData?.budget_max || 0)}
              </span>
            </div>
            {projectData?.area_sqft && (
              <div className="meta-item">
                <span className="meta-label">Area:</span>
                <span className="meta-value">{projectData?.area_sqft} sq ft</span>
              </div>
            )}
            {projectData?.timeline && (
              <div className="meta-item">
                <span className="meta-label">Timeline:</span>
                <span className="meta-value">{projectData?.timeline}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Priority:</span>
              <span className="meta-value priority-badge priority-${projectData?.priority || 'medium'}">
                {(projectData?.priority || 'medium').toUpperCase()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Posted:</span>
              <span className="meta-value">{formatDate(projectData?.created_at)}</span>
            </div>
          </div>

          <div className="project-description">
            <h3>Project Description</h3>
            <p>{projectData?.description || 'No description provided'}</p>
          </div>

          {projectData?.requirements && (
            <div className="project-requirements">
              <h3>Additional Requirements</h3>
              <p>{projectData?.requirements}</p>
            </div>
          )}

          {user.userType === 'architect' && (projectData?.customer_first_name || projectData?.customer_username || projectData?.customer_email) && (
            <div className="customer-info">
              <h3>Customer Information</h3>
              {projectData?.customer_first_name && projectData?.customer_last_name && (
                <p><strong>Name:</strong> {projectData?.customer_first_name} {projectData?.customer_last_name}</p>
              )}
              <p><strong>Username:</strong> {projectData?.customer_username || projectData?.customer_email}</p>
              {projectData?.customer_email && (
                <p><strong>Email:</strong> {projectData?.customer_email}</p>
              )}
            </div>
          )}
        </div>

        {/* Bids Section */}
        <div className="bids-section">
          <h3>
            {user.userType === 'customer' ? 'Received Bids' : 'Current Bids'} 
            ({bids.length})
          </h3>

          {userBid && user.userType === 'architect' && (
            <div className="user-bid-status">
              <div className="bid-card user-bid">
                <div className="bid-header">
                  <h4>Your Bid {getBidStatusIcon(userBid?.status || 'pending')}</h4>
                  <span 
                    className="bid-status"
                    style={{ backgroundColor: getStatusColor(userBid?.status || 'pending') }}
                  >
                    {(userBid?.status || 'pending').toUpperCase()}
                  </span>
                </div>
                <div className="bid-content">
                  <div className="bid-amount">
                    <strong>Bid Amount: {formatBudget(userBid.bid_amount)}</strong>
                  </div>
                  <div className="bid-duration">
                    <strong>Duration: {userBid.estimated_duration}</strong>
                  </div>
                  <p className="bid-proposal">{userBid.proposal_description}</p>
                  {userBid.experience_note && (
                    <p className="bid-experience">
                      <strong>Experience Note:</strong> {userBid.experience_note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(() => {
            const filteredBids = bids.filter(bid => {
              // For architects, filter out their own bid (it's shown in "Your Bid" section)
              if (user.userType === 'architect') {
                return bid.architect_id !== user.id;
              }
              // For customers, show all bids
              return true;
            });

            return filteredBids.length === 0 ? (
              <div className="no-bids">
                <p>
                  {user.userType === 'architect' 
                    ? "No other bids submitted yet." 
                    : "No bids submitted yet."
                  }
                </p>
              </div>
            ) : (
              <div className="bids-list">
                {filteredBids.map(bid => (
                <div key={bid.id} className="bid-card">
                  <div className="bid-header">
                    <div className="architect-info">
                      <h4>{bid.architect_first_name} {bid.architect_last_name}</h4>
                      {bid.company_name && (
                        <p className="company-name">{bid.company_name}</p>
                      )}
                      {user.userType === 'customer' && architectRatings[bid.architect_id] && (
                        <div className="architect-rating">
                          <div className="rating-stars">
                            {renderStarRating(parseFloat(architectRatings[bid.architect_id].average_rating || 0))}
                          </div>
                          <span className="rating-text">
                            ({architectRatings[bid.architect_id].average_rating || '0.0'}) 
                            <br />
                            {architectRatings[bid.architect_id].total_ratings > 0 && 
                              `  ${architectRatings[bid.architect_id].total_ratings} review${architectRatings[bid.architect_id].total_ratings !== 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}
                      {bid.years_experience && (
                        <p className="experience">{bid.years_experience} years experience</p>
                      )}
                    </div>
                    <span 
                      className="bid-status"
                      style={{ backgroundColor: getStatusColor(bid?.status || 'pending') }}
                    >
                      {getBidStatusIcon(bid?.status || 'pending')} {(bid?.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  <div className="bid-content">
                    <div className="bid-details">
                      <div className="bid-amount">
                        <strong>Bid Amount: {formatBudget(bid.bid_amount)}</strong>
                      </div>
                      <div className="bid-duration">
                        <strong>Estimated Duration: {bid.estimated_duration}</strong>
                      </div>
                    </div>

                    <div className="bid-proposal">
                      <h5>Proposal:</h5>
                      <p>{bid.proposal_description}</p>
                    </div>

                    {bid.experience_note && (
                      <div className="bid-experience">
                        <h5>Experience & Approach:</h5>
                        <p>{bid.experience_note}</p>
                      </div>
                    )}

                    <div className="bid-submitted">
                      <small>Submitted on {formatDate(bid.submitted_at)}</small>
                    </div>

                    {/* Customer Actions */}
                    {user.userType === 'customer' && (
                      <div className="bid-actions">
                        <button 
                          className="view-profile-btn"
                          onClick={() => {
                            setSelectedArchitect({
                              id: bid.architect_id,
                              name: `${bid.architect_first_name} ${bid.architect_last_name}`,
                              companyName: bid.company_name
                            });
                            setShowFirmProfile(true);
                          }}
                        >
                          <i className="fas fa-user"></i>
                          View Profile
                        </button>
                        
                        {bid?.status === 'pending' && projectData?.status === 'open' && (
                          <>
                            <button 
                              className="accept-btn"
                              onClick={() => handleBidDecision(bid.id, 'accepted')}
                              disabled={processingBid === bid.id}
                            >
                              {processingBid === bid.id ? 'Processing...' : 'Accept Bid'}
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => handleBidDecision(bid.id, 'rejected')}
                              disabled={processingBid === bid.id}
                            >
                              {processingBid === bid.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && completingProject && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setCompletingProject(null);
          }}
          project={completingProject.project}
          architect={completingProject.architect}
          onSubmit={handleRatingSubmit}
        />
      )}

      {/* Firm Profile Modal */}
      {showFirmProfile && selectedArchitect && (
        <FirmProfileModal
          isOpen={showFirmProfile}
          onClose={() => {
            setShowFirmProfile(false);
            setSelectedArchitect(null);
          }}
          architectId={selectedArchitect.id}
          architectName={selectedArchitect.name}
          companyName={selectedArchitect.companyName}
        />
      )}
    </div>
  );
};

export default ProjectDetails;