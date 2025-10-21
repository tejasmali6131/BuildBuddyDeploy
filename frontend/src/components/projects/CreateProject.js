import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastProvider';
import { scrollToTop } from '../ScrollToTop';
import { API_BASE_URL_EXPORT } from '../../data/api';
import './Projects.css';

const CreateProject = ({ onProjectCreated, onCancel }) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    project_type: '',
    location: '',
    area_sqft: '',
    budget_min: 100000,
    budget_max: 1000000,
    timeline: '',
    requirements: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop();
  }, []);

  const projectTypes = [
    'Residential Home',
    'Commercial Building',
    'Renovation',
    'Interior Design',
    'Landscape Design',
    'Industrial Building',
    'Apartment Complex',
    'Office Space',
    'Retail Store',
    'Restaurant',
    'Other'
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
    'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
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

    if (!projectData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!projectData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!projectData.project_type) {
      newErrors.project_type = 'Project type is required';
    }

    if (!projectData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!projectData.budget_min || projectData.budget_min <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0';
    }

    if (!projectData.budget_max || projectData.budget_max <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0';
    }

    if (projectData.budget_min && projectData.budget_max && 
        parseInt(projectData.budget_min) >= parseInt(projectData.budget_max)) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum budget';
    }

    if (projectData.area_sqft && projectData.area_sqft <= 0) {
      newErrors.area_sqft = 'Area must be greater than 0';
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
      const response = await fetch(`${API_BASE_URL_EXPORT}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...projectData,
          budget_min: parseInt(projectData.budget_min),
          budget_max: parseInt(projectData.budget_max),
          area_sqft: projectData.area_sqft ? parseInt(projectData.area_sqft) : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Project created successfully!');
        onProjectCreated && onProjectCreated(data.project);
        // Auto-close the form after successful creation
        setTimeout(() => {
          onCancel && onCancel();
        }, 1000); // Close after 1 second to let user see the success message
      } else {
        showError(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-header">
        <h2>Create New Project</h2>
        <button className="cancel-button" onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="create-project-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Project Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={projectData.title}
              onChange={handleInputChange}
              placeholder="e.g., Modern 3BHK House Design"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="project_type">Project Type *</label>
            <select
              id="project_type"
              name="project_type"
              value={projectData.project_type}
              onChange={handleInputChange}
              className={errors.project_type ? 'error' : ''}
            >
              <option value="">Select project type</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.project_type && <span className="error-message">{errors.project_type}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Project Description *</label>
          <textarea
            id="description"
            name="description"
            value={projectData.description}
            onChange={handleInputChange}
            placeholder="Describe your project requirements in detail..."
            rows="4"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <select
              id="location"
              name="location"
              value={projectData.location}
              onChange={handleInputChange}
              className={errors.location ? 'error' : ''}
            >
              <option value="">Select city</option>
              {indianCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="area_sqft">Area (sq ft)</label>
            <input
              type="number"
              id="area_sqft"
              name="area_sqft"
              value={projectData.area_sqft}
              onChange={handleInputChange}
              placeholder="e.g., 1200"
              min="1"
              className={errors.area_sqft ? 'error' : ''}
            />
            {errors.area_sqft && <span className="error-message">{errors.area_sqft}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="budget_range">Budget Range (₹) *</label>
            <div className="budget-slider-container">
              <div className="budget-slider-group">
                <label className="slider-label">From:</label>
                <input
                  type="range"
                  id="budget_min"
                  name="budget_min"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={projectData.budget_min}
                  onChange={e => {
                    const min = Number(e.target.value);
                    setProjectData(prev => ({
                      ...prev,
                      budget_min: min,
                      budget_max: Math.max(min + 10000, prev.budget_max)
                    }));
                    if (errors.budget_min) setErrors(prev => ({ ...prev, budget_min: '' }));
                  }}
                  className={errors.budget_min ? 'error' : ''}
                />
                <div className="budget-amount">₹{projectData.budget_min.toLocaleString()}</div>
              </div>
              
              <div className="budget-slider-group">
                <label className="slider-label">To:</label>
                <input
                  type="range"
                  id="budget_max"
                  name="budget_max"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={projectData.budget_max}
                  onChange={e => {
                    const max = Number(e.target.value);
                    setProjectData(prev => ({
                      ...prev,
                      budget_min: Math.min(prev.budget_min, max - 10000),
                      budget_max: max
                    }));
                    if (errors.budget_max) setErrors(prev => ({ ...prev, budget_max: '' }));
                  }}
                  className={errors.budget_max ? 'error' : ''}
                />
                <div className="budget-amount">₹{projectData.budget_max.toLocaleString()}</div>
              </div>
            </div>
            {errors.budget_min && <span className="error-message">{errors.budget_min}</span>}
            {errors.budget_max && <span className="error-message">{errors.budget_max}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="timeline">Expected Timeline</label>
            <input
              type="text"
              id="timeline"
              name="timeline"
              value={projectData.timeline}
              onChange={handleInputChange}
              placeholder="e.g., 6 months"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority Level</label>
            <select
              id="priority"
              name="priority"
              value={projectData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Additional Requirements</label>
          <textarea
            id="requirements"
            name="requirements"
            value={projectData.requirements}
            onChange={handleInputChange}
            placeholder="Any specific requirements, preferences, or constraints..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;