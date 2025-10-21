import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import CreateProject from '../projects/CreateProject';
import ProjectDetails from '../projects/ProjectDetails';
import RatingModal from '../ratings/RatingModal';
import AIVisualizationSection from '../common/AIVisualizationSection';
import { scrollToTop } from '../ScrollToTop';
import useToast from '../../hooks/useToast';
import { API_BASE_URL_EXPORT } from '../../data/api';
import '../../styles/Dashboard.css';

const CustomerDashboard = () => {
  const { user, logout, updateUser, token, loading } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    type: '',
    data: []
  });
  const [loadingModal, setLoadingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completingProject, setCompletingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const handleSave = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL_EXPORT}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update the user in context with the returned data
      updateUser(data.user);
      setIsEditing(false);
      
      // Show success message (you can add a toast notification here)
      console.log('Profile updated successfully');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      // You can add error state handling here
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Project management functions
  const fetchMyProjects = async () => {
    if (!token) {
      console.log('No token available, skipping project fetch');
      return;
    }
    
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL_EXPORT}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Ensure we have a valid array and filter out any invalid projects
        const validProjects = Array.isArray(data.projects) 
          ? data.projects.filter(project => project && project.id)
          : [];
        setProjects(validProjects);
        console.log('Fetched projects:', validProjects);
      } else {
        console.error('Error fetching projects:', data.message);
        setProjects([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Reset to empty array on error
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    if (newProject && newProject.id) {
      setProjects(prev => [newProject, ...prev]);
      setShowCreateForm(false);
      setActiveTab('projects'); // Switch to projects tab
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    if (updatedProject && updatedProject.id) {
      setProjects(prev => prev.map(p => 
        p && p.id === updatedProject.id ? updatedProject : p
      ).filter(p => p && p.id)); // Filter out any invalid projects
    }
  };

  const formatBudget = (min, max) => {
    const formatNumber = (num) => {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
      return `₹${num}`;
    };
    return `${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Handler functions for interactive cards
  const handleActiveProjectsClick = () => {
    const activeProjects = projects.filter(p => p && p.status === 'in_progress');
    setModalContent({
      title: 'Active Projects',
      type: 'projects',
      data: activeProjects
    });
    setShowDetailModal(true);
  };

  const handleBidsReceivedClick = async () => {
    setLoadingModal(true);
    try {
      // Get bids for all customer's projects
      const response = await fetch(`${API_BASE_URL_EXPORT}/projects/bids`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModalContent({
          title: 'Bids Received',
          type: 'bids',
          data: data.bids || []
        });
        setShowDetailModal(true);
      } else {
        // Fallback: show project-based summary if no specific bids endpoint
        const projectsWithBids = projects.filter(p => p && p.bid_count > 0);
        setModalContent({
          title: 'Projects with Bids',
          type: 'projectBids',
          data: projectsWithBids
        });
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      // Fallback: show project-based summary
      const projectsWithBids = projects.filter(p => p && p.bid_count > 0);
      setModalContent({
        title: 'Projects with Bids',
        type: 'projectBids',
        data: projectsWithBids
      });
      setShowDetailModal(true);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCompletedProjectsClick = () => {
    const completedProjects = projects.filter(p => p && p.status === 'completed');
    setModalContent({
      title: 'Completed Projects',
      type: 'projects',
      data: completedProjects
    });
    setShowDetailModal(true);
  };

  const handleTotalInvestmentClick = () => {
    const investmentProjects = projects.filter(p => p && (p.status === 'in_progress' || p.status === 'completed'));
    setModalContent({
      title: 'Investment Breakdown',
      type: 'investment',
      data: investmentProjects
    });
    setShowDetailModal(true);
  };

  // Handle project completion
  const handleMarkAsCompleted = (project) => {
    // Use architect information from the project data (from accepted bid)
    setCompletingProject({
      project,
      architect: {
        first_name: project.accepted_architect_name?.split(' ')[0] || 'Unknown',
        last_name: project.accepted_architect_name?.split(' ').slice(1).join(' ') || 'Architect'
      }
    });
    setShowRatingModal(true);
  };

  // Handle rating submission
  const handleRatingSubmit = async (ratingData) => {
    try {
      const architectId = completingProject.project.accepted_architect_id;
      
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
      setProjects(prev => prev.map(p => 
        p.id === completingProject.project.id 
          ? { ...p, status: 'completed' }
          : p
      ));

      setShowRatingModal(false);
      setCompletingProject(null);

    } catch (error) {
      console.error('Error completing project:', error);
      throw error; // Re-throw so RatingModal can show error
    }
  };

  // Fetch projects when authentication is loaded and user/token are available
  React.useEffect(() => {
    console.log('🔍 Auth effect triggered:', { 
      loading, 
      user: user ? { id: user.id, userType: user.userType, firstName: user.firstName } : null, 
      token: token ? `${token.substring(0, 20)}...` : null 
    });
    
    if (loading) {
      console.log('⏳ Auth still loading, waiting...');
      return; // Don't fetch while auth is still loading
    }
    
    if (!user || !token) {
      console.log('❌ No user or token available after auth loading');
      return;
    }
    
    console.log('✅ Auth ready, fetching projects for user:', user.id);
    fetchMyProjects();
  }, [loading, user, token]);

  // Also fetch projects when switching tabs (but only if auth is ready)
  React.useEffect(() => {
    if (loading || !user || !token) return;
    
    if ((activeTab === 'projects' && !showCreateForm && !selectedProject) || activeTab === 'overview') {
      fetchMyProjects();
    }
  }, [activeTab, showCreateForm, selectedProject]);

  // Effect to scroll to top when tab changes
  useEffect(() => {
    scrollToTop();
  }, [activeTab]);

  // Effect to scroll to top when navigating between forms and project views
  useEffect(() => {
    scrollToTop();
  }, [showCreateForm, selectedProject]);

  // Show loading spinner while authentication is being initialized
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-auth">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const validProjects = projects.filter(p => p && p.id);
    const activeProjects = validProjects.filter(p => p.status === 'in_progress').length;
    const completedProjects = validProjects.filter(p => p.status === 'completed').length;
    const totalBids = validProjects.reduce((sum, p) => sum + (p.bid_count || 0), 0);
    const totalInvestment = validProjects.reduce((sum, p) => {
      if (p.status === 'in_progress' || p.status === 'completed') {
        // Use accepted bid amount if available, otherwise use budget_max
        const investmentAmount = p.accepted_bid_amount || p.budget_max || 0;
        return sum + investmentAmount;
      }
      return sum;
    }, 0);

    return (
      <div className="dashboard-section">
        <div className="stats-grid">
          <div 
            className="stat-card clickable" 
            onClick={() => handleActiveProjectsClick()}
          >
            <div className="stat-icon">
              <i className="fas fa-project-diagram"></i>
            </div>
            <div className="stat-content">
              <h3>{activeProjects}</h3>
              <p>Active Projects</p>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
          <div 
            className="stat-card clickable" 
            onClick={() => handleBidsReceivedClick()}
          >
            <div className="stat-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <div className="stat-content">
              <h3>{totalBids}</h3>
              <p>Total Bids Received</p>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
          <div 
            className="stat-card clickable" 
            onClick={() => handleCompletedProjectsClick()}
          >
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-content">
              <h3>{completedProjects}</h3>
              <p>Completed Projects</p>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
          <div 
            className="stat-card clickable" 
            onClick={() => handleTotalInvestmentClick()}
          >
            <div className="stat-icon">
              <i className="fas fa-rupee-sign"></i>
            </div>
            <div className="stat-content">
              <h3>{totalInvestment > 0 ? formatBudget(totalInvestment, totalInvestment).split(' - ')[0] : '₹0'}</h3>
              <p>Total Investment</p>
            </div>
            <div className="stat-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <div className="quick-actions-header">
            <h3>Quick Actions</h3>
            <button 
              className="btn btn-refresh"
              onClick={fetchMyProjects}
              disabled={projectsLoading}
              title="Refresh Projects"
            >
              <i className={`fas fa-sync-alt ${projectsLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => {
                setActiveTab('projects');
                setShowCreateForm(true);
              }}
            >
              <i className="fas fa-plus"></i>
              Create New Project
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('projects')}
            >
              <i className="fas fa-project-diagram"></i>
              View All Projects
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user-edit"></i>
              Edit Profile
            </button>
          </div>
        </div>
        {/* AI Visualization Section */}
        <AIVisualizationSection />
    </div>
    
    );
  };

  const renderProjects = () => {
    // Show create project form
    if (showCreateForm) {
      return (
        <CreateProject
          onProjectCreated={handleProjectCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      );
    }

    // Show project details
    if (selectedProject) {
      return (
        <ProjectDetails
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      );
    }

    // Show customer projects list
    return (
      <div className="dashboard-section">
        <div className="section-header">
          <h2>My Projects</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <i className="fas fa-plus"></i>
            Create New Project
          </button>
        </div>

        {projectsLoading ? (
          <div className="loading">Loading your projects...</div>
        ) : (
          <>
            {projects.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-project-diagram"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to get started with BuildBuddy.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  <i className="fas fa-plus"></i>
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.filter(project => project && project.id).map(project => (
                  <div key={project.id} className="project-card">
                    <div className="project-card-header">
                      <h3 className="project-title">{project.title}</h3>
                      <span 
                        className="project-status"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {(project.status || 'unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="project-card-body">
                      <p className="project-type">{project.project_type || 'General'}</p>
                      <p className="project-location">📍 {project.location || 'Not specified'}</p>
                      
                      <div className="project-details">
                        <div className="detail-item">
                          <span className="detail-label">Budget:</span>
                          <span className="detail-value">
                            {formatBudget(project.budget_min || 0, project.budget_max || 0)}
                          </span>
                        </div>
                        
                        {project.area_sqft && (
                          <div className="detail-item">
                            <span className="detail-label">Area:</span>
                            <span className="detail-value">{project.area_sqft} sq ft</span>
                          </div>
                        )}
                        
                        <div className="detail-item">
                          <span className="detail-label">Posted:</span>
                          <span className="detail-value">{project.created_at ? formatDate(project.created_at) : 'N/A'}</span>
                        </div>
                      </div>

                      <p className="project-description">
                        {project.description && project.description.length > 120 
                          ? `${project.description.substring(0, 120)}...`
                          : (project.description || 'No description available')
                        }
                      </p>
                    </div>

                    <div className="project-card-footer">
                      <button 
                        className="view-details-btn"
                        onClick={() => setSelectedProject(project)}
                      >
                        View Details & Bids
                      </button>
                      
                      {project.status === 'in_progress' && project.accepted_architect_id && (
                        <button
                          className="complete-project-btn"
                          onClick={() => handleMarkAsCompleted(project)}
                        >
                          <i className="fas fa-check-circle"></i>
                          Mark as Completed
                        </button>
                      )}
                      
                      {project.bid_count > 0 && (
                        <span className="bid-indicator">
                          {project.bid_count} bid{project.bid_count > 1 ? 's' : ''} received
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Profile Settings</h2>
        {!isEditing && (
          <button onClick={handleEdit} className="btn btn-outline">
            <i className="fas fa-edit"></i>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={editForm.firstName}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              <div className="form-display">{user?.firstName}</div>
            )}
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={editForm.lastName}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              <div className="form-display">{user?.lastName}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleInputChange}
              className="form-input"
            />
          ) : (
            <div className="form-display">{user?.email}</div>
          )}
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={editForm.phone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="+91 98765 43210"
            />
          ) : (
            <div className="form-display">{user?.phone}</div>
          )}
        </div>

        <div className="form-group">
          <label>Account Type</label>
          <div className="form-display">
            <span className="user-type-badge customer">Customer</span>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button onClick={handleSave} className="btn btn-primary">
              <i className="fas fa-save"></i>
              Save Changes
            </button>
            <button onClick={handleCancel} className="btn btn-outline">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailModal = () => {
    if (!showDetailModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{modalContent.title}</h3>
            <button 
              className="modal-close" 
              onClick={() => setShowDetailModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-body">
            {loadingModal ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {modalContent.type === 'projects' && (
                  <div className="projects-list">
                    {modalContent.data.length > 0 ? (
                      modalContent.data.map((project) => (
                        <div key={project.id} className="project-card">
                          <h4>{project.title}</h4>
                          <p><strong>Location:</strong> {project.location}</p>
                          <p><strong>Budget:</strong> {formatBudget(project.budget_min, project.budget_max)}</p>
                          <p><strong>Status:</strong> {project.status}</p>
                          <p><strong>Description:</strong> {project.description}</p>
                        </div>
                      ))
                    ) : (
                      <p>No projects found.</p>
                    )}
                  </div>
                )}
                
                {modalContent.type === 'bids' && (
                  <div className="bids-list">
                    {modalContent.data.length > 0 ? (
                      modalContent.data.map((bid) => (
                        <div key={bid.id} className="bid-card">
                          <h4>{bid.project_title}</h4>
                          <p><strong>Architect:</strong> {bid.architect_name}</p>
                          <p><strong>Bid Amount:</strong> ₹{bid.bid_amount?.toLocaleString()}</p>
                          <p><strong>Status:</strong> {bid.status}</p>
                          <p><strong>Submitted:</strong> {formatDate(bid.created_at)}</p>
                        </div>
                      ))
                    ) : (
                      <p>No bids found.</p>
                    )}
                  </div>
                )}

                {modalContent.type === 'projectBids' && (
                  <div className="projects-list">
                    {modalContent.data.length > 0 ? (
                      modalContent.data.map((project) => (
                        <div key={project.id} className="project-card">
                          <h4>{project.title}</h4>
                          <p><strong>Location:</strong> {project.location}</p>
                          <p><strong>Budget:</strong> {formatBudget(project.budget_min, project.budget_max)}</p>
                          <p><strong>Bids Received:</strong> {project.bid_count}</p>
                          <p><strong>Status:</strong> {project.status}</p>
                        </div>
                      ))
                    ) : (
                      <p>No projects with bids found.</p>
                    )}
                  </div>
                )}

                {modalContent.type === 'investment' && (
                  <div className="investment-list">
                    {modalContent.data.length > 0 ? (
                      modalContent.data.map((project) => (
                        <div key={project.id} className="investment-card">
                          <h4>{project.title}</h4>
                          <p><strong>Location:</strong> {project.location}</p>
                          <p><strong>Investment:</strong> {
                            project.accepted_bid_amount 
                              ? `₹${project.accepted_bid_amount.toLocaleString()}`
                              : formatBudget(project.budget_min, project.budget_max).split(' - ')[0]
                          }</p>
                          <p><strong>Status:</strong> {project.status}</p>
                        </div>
                      ))
                    ) : (
                      <p>No investments found.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {renderDetailModal()}
      {/* Dashboard Header with Logo, Profile and Logout */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-logo">
            <h2>BuildBuddy</h2>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i>
            Profile
          </button>
          <button onClick={logout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-banner">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p>Ready to continue building your dream project?</p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-tachometer-alt"></i>
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <i className="fas fa-project-diagram"></i>
          My Projects
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="tab-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'profile' && renderProfile()}
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

      {/* Toast Container */}
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default CustomerDashboard;