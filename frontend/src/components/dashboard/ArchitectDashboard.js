import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProjectList from '../projects/ProjectList';
import PortfolioManager from '../portfolio/PortfolioManager';
import RatingsManager from '../ratings/RatingsManager';
import AIVisualizationSection from '../common/AIVisualizationSection';
import { scrollToTop } from '../ScrollToTop';
import '../../styles/Dashboard.css';

const ArchitectDashboard = () => {
  const { user, logout, updateUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    totalClients: 0,
    totalRatings: 0,
    newInquiries: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    type: '',
    data: []
  });
  const [loadingModal, setLoadingModal] = useState(false);
  const [projectsInitialFilters, setProjectsInitialFilters] = useState({});
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.architectData?.company_name || '',
    license: user?.architectData?.license_number || '',
    experience: user?.architectData?.years_experience || '',
    specialization: user?.architectData?.specialization || '',
    portfolio: user?.architectData?.portfolio_url || ''
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    if (!token) {
      console.log('No token available for fetching stats');
      return;
    }

    try {
      setLoadingStats(true);
      console.log('Fetching architect dashboard statistics...');

      const response = await fetch('/api/bids/dashboard-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }

      const stats = await response.json();
      console.log('Dashboard stats received:', stats);

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      // Keep default values on error
    } finally {
      setLoadingStats(false);
    }
  };

  // Effect to fetch stats when component mounts or tab changes to overview
  useEffect(() => {
    if (user && token && activeTab === 'overview') {
      fetchDashboardStats();
    }
  }, [user, token, activeTab]);

  // Effect to scroll to top when tab changes
  useEffect(() => {
    scrollToTop();
  }, [activeTab]);

  // Effect to scroll to top when modals are closed (user returns to main content)
  useEffect(() => {
    if (!showDetailModal) {
      scrollToTop();
    }
  }, [showDetailModal]);

  // Handler for clients stat card click
  const handleClientsClick = async () => {
    if (!token) return;
    
    setLoadingModal(true);
    setShowDetailModal(true);
    setModalContent({
      title: 'Your Clients',
      type: 'clients',
      data: []
    });

    try {
      const response = await fetch('/api/bids/my-bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const acceptedBids = data.bids?.filter(bid => bid.status === 'accepted') || [];
        
        // Group by customer to get unique clients
        const clientsMap = new Map();
        acceptedBids.forEach(bid => {
          const clientKey = bid.customer_email;
          if (!clientsMap.has(clientKey)) {
            clientsMap.set(clientKey, {
              name: `${bid.customer_first_name} ${bid.customer_last_name}`,
              email: bid.customer_email,
              projects: []
            });
          }
          clientsMap.get(clientKey).projects.push({
            title: bid.project_title,
            location: bid.project_location,
            amount: bid.bid_amount
          });
        });

        setModalContent({
          title: `Your Clients (${clientsMap.size})`,
          type: 'clients',
          data: Array.from(clientsMap.values())
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  // Handler for Active Projects card click - open Projects tab with in_progress filter
  const handleActiveProjectsClick = () => {
    console.log('🎯 === ACTIVE PROJECTS CLICK ===');
    console.log('🎯 Current projectsInitialFilters:', projectsInitialFilters);
    console.log('🎯 Setting initial filters to:', { status: 'in_progress' });
    
    // Set the filter first
    setProjectsInitialFilters({ status: 'in_progress' });
    console.log('🎯 Filter state updated, switching to projects tab');
    
    // Then switch to projects tab
    setActiveTab('projects');
    console.log('🎯 Tab switched to projects');
  };

  // Handler for ratings stat card click
  const handleRatingsClick = () => {
    setActiveTab('ratings');
    scrollToTop();
  };

  // Handler for inquiries stat card click
  const handleInquiriesClick = async () => {
    // This opens a modal showing pending bids (renamed from inquiries)
    if (!token) return;
    
    setLoadingModal(true);
    setShowDetailModal(true);
    setModalContent({
      title: 'Pending Bids',
      type: 'pending-bids',
      data: []
    });

    try {
      const response = await fetch('/api/bids/my-bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const pendingBids = data.bids?.filter(bid => bid.status === 'pending') || [];
        
        setModalContent({
          title: `Pending Bids (${pendingBids.length})`,
          type: 'pending-bids',
          data: pendingBids
        });
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.architectData?.company_name || '',
      license: user?.architectData?.license_number || '',
      experience: user?.architectData?.years_experience || '',
      specialization: user?.architectData?.specialization || '',
      portfolio: user?.architectData?.portfolio_url || ''
    });
  };

  const handleSave = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const profileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        // Architect specific fields
        company: editForm.company,
        license: editForm.license,
        experience: editForm.experience,
        specialization: editForm.specialization,
        portfolio: editForm.portfolio
      };

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update the user in context with the returned data
      updateUser(data.user);
      setIsEditing(false);
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.architectData?.company_name || '',
      license: user?.architectData?.license_number || '',
      experience: user?.architectData?.years_experience || '',
      specialization: user?.architectData?.specialization || '',
      portfolio: user?.architectData?.portfolio_url || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderOverview = () => (
    <div className="dashboard-section">
      {/* <h2>Welcome back, {user?.firstName}!</h2> */}
      <div className="stats-grid">
        <div 
          className="stat-card clickable" 
          onClick={() => handleActiveProjectsClick()}
          title="Click to view your active projects"
        >
          <div className="stat-icon">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="stat-content">
            <h3>{loadingStats ? '...' : dashboardStats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
          <div className="stat-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>
        <div 
          className="stat-card clickable" 
          onClick={() => handleClientsClick()}
          title="Click to view client details"
        >
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{loadingStats ? '...' : dashboardStats.totalClients}</h3>
            <p>Total Clients</p>
          </div>
          <div className="stat-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>
        <div 
          className="stat-card clickable" 
          onClick={() => handleRatingsClick()}
          title="Click to view your ratings and reviews"
        >
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>{loadingStats ? '...' : dashboardStats.totalRatings}</h3>
            <p>Ratings</p>
          </div>
          <div className="stat-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>
        <div 
          className="stat-card clickable" 
          onClick={() => handleInquiriesClick()}
          title="Click to view pending bids"
        >
          <div className="stat-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="stat-content">
            <h3>{loadingStats ? '...' : dashboardStats.newInquiries}</h3>
            <p>Pending Bids</p>
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
            onClick={fetchDashboardStats}
            disabled={loadingStats}
            title="Refresh Statistics"
          >
            <i className={`fas fa-sync-alt ${loadingStats ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setProjectsInitialFilters({});  // Clear any filters when navigating normally
              setActiveTab('projects');
            }}
          >
            <i className="fas fa-briefcase"></i>
            View Projects
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('portfolio')}
          >
            <i className="fas fa-images"></i>
            Manage Portfolio
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

  const renderProjects = () => (
    <div className="dashboard-section">
      <ProjectList 
        key={JSON.stringify(projectsInitialFilters)} 
        initialFilters={projectsInitialFilters} 
      />
    </div>
  );

  // Modal component for detailed views
  const renderDetailModal = () => {
    if (!showDetailModal) return null;

    const renderModalContent = () => {
      if (loadingModal) {
        return (
          <div className="modal-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        );
      }

      switch (modalContent.type) {
        case 'clients':
          return (
            <div className="clients-list">
              {modalContent.data.length === 0 ? (
                <p className="no-data">No clients found yet.</p>
              ) : (
                modalContent.data.map((client, index) => (
                  <div key={index} className="client-card">
                    <div className="client-header">
                      <h4>{client.name}</h4>
                      <p className="client-email">{client.email}</p>
                    </div>
                    <div className="client-projects">
                      <p><strong>Projects:</strong> {client.projects.length}</p>
                      {client.projects.map((project, projIndex) => (
                        <div key={projIndex} className="project-item">
                          <div className="project-main">
                            <h5 className="project-title">{project.title}</h5>
                            <div className="project-details">
                              <span className="project-location">
                                <i className="fas fa-map-marker-alt"></i>
                                {project.location}
                              </span>
                            </div>
                          </div>
                          <div className="project-amount">
                            ₹{project.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        

        case 'inquiries':
        case 'pending-bids':
          return (
            <div className="inquiries-list">
              {modalContent.data.length === 0 ? (
                <p className="no-data">No pending bids.</p>
              ) : (
                modalContent.data.map((inquiry, index) => (
                  <div key={index} className="inquiry-card">
                    <h4>{inquiry.project_title}</h4>
                    <p className="inquiry-location">{inquiry.project_location}</p>
                    <p className="inquiry-client">From: {inquiry.customer_first_name} {inquiry.customer_last_name}</p>
                    <p className="inquiry-budget">Budget: ₹{inquiry.budget_min?.toLocaleString()} - ₹{inquiry.budget_max?.toLocaleString()}</p>
                    <p className="inquiry-bid">Your Bid: ₹{inquiry.bid_amount.toLocaleString()}</p>
                    <div className="inquiry-status">
                      <span className="status-badge pending">Pending Response</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        
        default:
          return <p>No data available.</p>;
      }
    };

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
            {renderModalContent()}
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="dashboard-section">
      <div className="profile-header">
        <h2>Professional Profile</h2>
        {!isEditing && (
          <button className="btn btn-outline" onClick={handleEdit}>
            <i className="fas fa-edit"></i>
            Edit Profile
          </button>
        )}
      </div>
      
      <div className="profile-form">
        <h3>Personal Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
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
            <label className="form-label">Last Name</label>
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
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
            <label className="form-label">Phone Number</label>
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
        </div>

        <h3>Professional Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Company/Firm</label>
            {isEditing ? (
              <input
                type="text"
                name="company"
                value={editForm.company}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              <div className="form-display">{user?.architectData?.company_name || 'Not specified'}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">License Number</label>
            {isEditing ? (
              <input
                type="text"
                name="license"
                value={editForm.license}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              <div className="form-display">{user?.architectData?.license_number || 'Not specified'}</div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Experience</label>
            {isEditing ? (
              <select
                name="experience"
                value={editForm.experience}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select experience level</option>
                <option value="1-3">1-3 years</option>
                <option value="4-7">4-7 years</option>
                <option value="8-15">8-15 years</option>
                <option value="15+">15+ years</option>
              </select>
            ) : (
              <div className="form-display">{user?.architectData?.years_experience || 'Not specified'}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Specialization</label>
            {isEditing ? (
              <select
                name="specialization"
                value={editForm.specialization}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select specialization</option>
                <option value="residential">Residential Architecture</option>
                <option value="commercial">Commercial Architecture</option>
                <option value="interior">Interior Design</option>
                <option value="landscape">Landscape Architecture</option>
                <option value="sustainable">Sustainable Design</option>
                <option value="restoration">Historic Restoration</option>
              </select>
            ) : (
              <div className="form-display">{user?.architectData?.specialization || 'Not specified'}</div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Portfolio Website</label>
          {isEditing ? (
            <input
              type="url"
              name="portfolio"
              value={editForm.portfolio}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://yourportfolio.com"
            />
          ) : (
            <div className="form-display">
              {user?.architectData?.portfolio_url ? (
                <a href={user.architectData.portfolio_url} target="_blank" rel="noopener noreferrer">
                  {user.architectData.portfolio_url}
                </a>
              ) : (
                'Not specified'
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <div className="form-display badge architect">Architect</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Member Since</label>
          <div className="form-display">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        
        {isEditing && (
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fas fa-save"></i>
              Save Changes
            </button>
            <button className="btn btn-outline" onClick={handleCancel}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <PortfolioManager />
  );

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
        <p>Ready to create amazing architectural designs?</p>
      </div>

      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-home"></i>
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => {
            setProjectsInitialFilters({});  // Clear any filters when navigating normally
            setActiveTab('projects');
          }}
        >
          <i className="fas fa-project-diagram"></i>
          Projects
        </button>
        <button
          className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <i className="fas fa-images"></i>
          Portfolio
        </button>
        <button
          className={`nav-tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          <i className="fas fa-star"></i>
          Ratings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'ratings' && <RatingsManager />}
        {activeTab === 'profile' && renderProfile()}
      </div>


    </div>
  );
};

export default ArchitectDashboard;