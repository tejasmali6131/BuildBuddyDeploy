import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import CreateProject from './CreateProject';
import ProjectDetails from './ProjectDetails';
import { scrollToTop } from '../ScrollToTop';
import { API_BASE_URL_EXPORT } from '../../data/api';
import './Projects.css';

const ProjectList = ({ initialFilters = {} }) => {
  console.log('🏗️ ProjectList component mounting/updating with initialFilters:', initialFilters);
  
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    project_type: '',
    location: '',
    priority: '',
    customer_name: '',
    budget_min: '',
    budget_max: '',
    area_min: '',
    area_max: ''
  });
  
  // Initialize appliedFilters from initialFilters so that when ProjectList
  // is mounted with an initial filter (e.g. from the dashboard) it will
  // immediately use that filter and trigger the fetch.
  const defaultFilters = {
    status: '',
    project_type: '',
    location: '',
    priority: '',
    customer_name: '',
    budget_min: '',
    budget_max: '',
    area_min: '',
    area_max: ''
  };

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const initialAppliedFilters = { ...defaultFilters, ...initialFilters };
    console.log('=== INITIAL APPLIED FILTERS ===', initialAppliedFilters);
    return initialAppliedFilters;
  });

  // Apply initialFilters when provided (e.g. from dashboard quick links)
  useEffect(() => {
    console.log('=== INITIAL FILTERS EFFECT ===');
    console.log('Component mounted/updated with initialFilters:', initialFilters);
    
    // Always apply the current initialFilters (could be empty object or have filters)
    const newFilters = { ...defaultFilters, ...initialFilters };
    console.log('Setting filters to:', newFilters);
    
    setFilters(newFilters);
    setAppliedFilters(newFilters);
  }, [initialFilters]);

  useEffect(() => {
    console.log('=== FETCH PROJECTS EFFECT ===');
    console.log('Applied filters for fetch:', appliedFilters);
    console.log('Token available:', token ? 'Yes' : 'No');
    
    if (token) {
      fetchProjects();
    }
  }, [token, appliedFilters]);

  // Scroll to top when navigating between project views
  useEffect(() => {
    scrollToTop();
  }, [selectedProject, showCreateForm]);

  const fetchProjects = async () => {
    try {
      console.log('=== FRONTEND: Fetching projects ===');
      console.log('User:', user);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Applied Filters for API call:', appliedFilters);
      
      const queryParams = new URLSearchParams();
      Object.keys(appliedFilters).forEach(key => {
        if (appliedFilters[key]) {
          queryParams.append(key, appliedFilters[key]);
        }
      });

      const apiUrl = `${API_BASE_URL_EXPORT}/projects?${queryParams}`;
      console.log('📡 Making API request to:', apiUrl);
      console.log('📋 Query params object:', Object.fromEntries(queryParams));

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers));
      console.log('📥 Response data:', data);
      console.log('📥 Projects array length:', data.projects?.length || 0);
      
      if (response.ok) {
        // Ensure we have a valid array and filter out any invalid projects
        const validProjects = Array.isArray(data.projects) 
          ? data.projects.filter(project => project && project.id)
          : [];
        
        // Debug: Log bid counts for each project
        console.log('=== BID COUNT DEBUG ===');
        validProjects.forEach((project, index) => {
          console.log(`Project ${index + 1}: "${project.title}"`);
          console.log(`  - bid_count: ${project.bid_count} (type: ${typeof project.bid_count})`);
          console.log(`  - bid_count > 0: ${project.bid_count > 0}`);
          console.log(`  - user.userType: ${user.userType}`);
        });
        
        setProjects(validProjects);
        console.log('✅ Projects set in state:', validProjects.length);
        console.log('✅ Projects titles:', validProjects.map(p => p.title));
      } else {
        console.error('Error fetching projects:', data.message);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    if (newProject && newProject.id) {
      setProjects(prev => [newProject, ...prev]);
      setShowCreateForm(false);
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    if (updatedProject && updatedProject.id) {
      setProjects(prev => prev.map(p => 
        p && p.id === updatedProject.id ? updatedProject : p
      ).filter(p => p && p.id));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      project_type: '',
      location: '',
      priority: '',
      customer_name: '',
      budget_min: '',
      budget_max: '',
      area_min: '',
      area_max: ''
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(appliedFilters).filter(value => value !== '').length;
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

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          setShowBidForm(false);
        }}
        onProjectUpdated={handleProjectUpdated}
        initialShowBidForm={showBidForm}
      />
    );
  }

  if (showCreateForm) {
    return (
      <CreateProject
        onProjectCreated={handleProjectCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2>
          {user.userType === 'customer' ? 'My Projects' : 'Available Projects'}
        </h2>
        <div className="header-actions-right">
          <button
            className="btn btn-outline"
            onClick={() => setShowFilters(prev => !prev)}
            aria-pressed={showFilters}
            title={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <i className="fas fa-filter"></i>
            {showFilters ? ' Hide Filters' : ' Show Filters'}
          </button>
        </div>
        {user.userType === 'customer' && (
          <button 
            className="create-project-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Project
          </button>
        )}
      </div>

      {/* Filters - hidden by default; toggle via header button */}
      {showFilters && (
        <div className="project-filters">
        <div className="filter-row">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            name="project_type"
            value={filters.project_type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="Residential Home">Residential Home</option>
            <option value="Commercial Building">Commercial Building</option>
            <option value="Renovation">Renovation</option>
            <option value="Interior Design">Interior Design</option>
            <option value="Landscape Design">Landscape Design</option>
            <option value="Other">Other</option>
          </select>

          <select
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Chennai">Chennai</option>
            <option value="Pune">Pune</option>
            <option value="Kolkata">Kolkata</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Surat">Surat</option>
          </select>

          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {user.userType === 'architect' && (
          <div className="filter-row">
            <input
              type="text"
              name="customer_name"
              value={filters.customer_name}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Customer name..."
            />

            <input
              type="number"
              name="budget_min"
              value={filters.budget_min}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Min budget (₹)"
            />

            <input
              type="number"
              name="budget_max"
              value={filters.budget_max}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Max budget (₹)"
            />

            <input
              type="number"
              name="area_min"
              value={filters.area_min}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Min area (sq ft)"
            />

            <input
              type="number"
              name="area_max"
              value={filters.area_max}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Max area (sq ft)"
            />
          </div>
        )}

        <div className="filter-actions">
          <button 
            className="search-btn"
            onClick={handleSearch}
          >
            <i className="fas fa-search"></i>
            Search Projects
          </button>
          
          <button 
            className="clear-btn"
            onClick={handleClearFilters}
          >
            <i className="fas fa-times"></i>
            Clear Filters
            {getActiveFilterCount() > 0 && (
              <span className="filter-count">({getActiveFilterCount()})</span>
            )}
          </button>
        </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>
              {user.userType === 'customer' 
                ? "You haven't created any projects yet. Click 'Create New Project' to get started!"
                : "No projects available at the moment. Check back later for new opportunities!"
              }
            </p>
          </div>
        ) : (
          projects.filter(project => project && project.id).map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-title">{project.title || 'Untitled Project'}</h3>
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
                      {formatBudget(project.budget_min, project.budget_max)}
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
                    <span className="detail-value">{formatDate(project.created_at)}</span>
                  </div>

                  {user.userType === 'architect' && (
                    <div className="detail-item">
                      <span className="detail-label">Bids:</span>
                      <span className="detail-value">{project.bid_count || 0}</span>
                    </div>
                  )}

                  {user.userType === 'customer' && (
                    <div className="detail-item">
                      <span className="detail-label">Received Bids:</span>
                      <span 
                        className={project.bid_count > 0 ? "detail-value highlight bid-count-visible" : "detail-value bid-count-visible"} 
                        style={{
                          color: '#ffffff !important',
                          background: project.bid_count > 0 ? '#6366f1 !important' : 'transparent',
                          fontSize: '14px !important',
                          fontWeight: 'bold !important',
                          padding: project.bid_count > 0 ? '6px 12px' : '4px 0',
                          borderRadius: project.bid_count > 0 ? '8px' : '0',
                          border: project.bid_count > 0 ? '2px solid #4f46e5' : 'none',
                          display: 'inline-block',
                          minWidth: '30px',
                          textAlign: 'center',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          WebkitTextFillColor: '#ffffff',
                          MozTextFillColor: '#ffffff'
                        }}
                      >
                        {project.bid_count || 0}
                      </span>
                    </div>
                  )}
                </div>

                <p className="project-description">
                  {project.description.length > 120 
                    ? `${project.description.substring(0, 120)}...`
                    : project.description
                  }
                </p>
              </div>

              <div className="project-card-footer">
                <button 
                  className="view-details-btn"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowBidForm(false);
                  }}
                >
                  View Details
                </button>
                
                {user.userType === 'architect' && project.status === 'open' && (
                  <button 
                    className="bid-btn"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowBidForm(true);
                    }}
                  >
                    Submit Bid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;