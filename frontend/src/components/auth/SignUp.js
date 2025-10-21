import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { scrollToTop } from '../ScrollToTop';
import '../../styles/Auth.css';

const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userType: 'customer',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Customer specific fields (removed - will be collected in dashboard)
    // Architect specific fields
    company: '',
    license: '',
    experience: '',
    specialization: '',
    portfolio: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
    
    // Common validations
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[91]?[789]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Indian phone number';
    }

    // Architect specific validations
    if (formData.userType === 'architect') {
      if (!formData.company) newErrors.company = 'Company/Firm name is required';
      if (!formData.license) newErrors.license = 'License number is required';
      if (!formData.experience) newErrors.experience = 'Experience is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Use AuthContext login function to properly set session
      login(data.user, data.token);

      // Handle successful registration with role-based redirection
      if (data.user.userType === 'customer') {
        navigate('/dashboard/customer', { replace: true });
      } else if (data.user.userType === 'architect') {
        navigate('/dashboard/architect', { replace: true });
      }
      
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ general: error.message || 'Sign up failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCustomerFields = () => (
    <div className="customer-info">
      <p className="info-text">
        <i className="fas fa-info-circle"></i>
        Great! We'll help you set up your project details after you create your account.
      </p>
    </div>
  );

  const renderArchitectFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="company" className="form-label">Company/Firm Name</label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className={`form-input ${errors.company ? 'error' : ''}`}
          placeholder="Your architectural firm"
          disabled={isLoading}
        />
        {errors.company && <span className="error-message">{errors.company}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="license" className="form-label">License Number</label>
        <input
          type="text"
          id="license"
          name="license"
          value={formData.license}
          onChange={handleChange}
          className={`form-input ${errors.license ? 'error' : ''}`}
          placeholder="Professional license number"
          disabled={isLoading}
        />
        {errors.license && <span className="error-message">{errors.license}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="experience" className="form-label">Years of Experience</label>
        <select
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className={`form-input ${errors.experience ? 'error' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select experience level</option>
          <option value="1-3">1-3 years</option>
          <option value="4-7">4-7 years</option>
          <option value="8-15">8-15 years</option>
          <option value="15+">15+ years</option>
        </select>
        {errors.experience && <span className="error-message">{errors.experience}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="specialization" className="form-label">Specialization</label>
        <select
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          className={`form-input ${errors.specialization ? 'error' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select specialization</option>
          <option value="residential">Residential Architecture</option>
          <option value="commercial">Commercial Architecture</option>
          <option value="interior">Interior Design</option>
          <option value="landscape">Landscape Architecture</option>
          <option value="sustainable">Sustainable Design</option>
          <option value="restoration">Historic Restoration</option>
        </select>
        {errors.specialization && <span className="error-message">{errors.specialization}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="portfolio" className="form-label">Portfolio Website (Optional)</label>
        <input
          type="url"
          id="portfolio"
          name="portfolio"
          value={formData.portfolio}
          onChange={handleChange}
          className="form-input"
          placeholder="https://yourportfolio.com"
          disabled={isLoading}
        />
      </div>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-wrapper has-signup">
        <div className="auth-card signup-card">
          <div className="auth-header">
            <h1 className="auth-title">Join BuildBuddy</h1>
            <p className="auth-subtitle">Create your account and start building your dreams</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            {/* User Type Selection */}
            <div className="user-type-selection">
              <label className="user-type-label">I am a:</label>
              <div className="user-type-options">
                <label className={`user-type-option ${formData.userType === 'customer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === 'customer'}
                    onChange={handleChange}
                  />
                  <span className="option-content">
                    <i className="fas fa-user"></i>
                    <span>Customer</span>
                  </span>
                </label>
                <label className={`user-type-option ${formData.userType === 'architect' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="architect"
                    checked={formData.userType === 'architect'}
                    onChange={handleChange}
                  />
                  <span className="option-content">
                    <i className="fas fa-drafting-compass"></i>
                    <span>Architect</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Common Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="John"
                  disabled={isLoading}
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Doe"
                  disabled={isLoading}
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="john@example.com"
                disabled={isLoading}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="+91 98765 43210"
                disabled={isLoading}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Conditional Fields Based on User Type */}
            <div className="conditional-fields">
              <h3 className="section-title">
                {formData.userType === 'customer' ? 'Welcome!' : 'Professional Information'}
              </h3>
              {formData.userType === 'customer' ? renderCustomerFields() : renderArchitectFields()}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`auth-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/signin" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;