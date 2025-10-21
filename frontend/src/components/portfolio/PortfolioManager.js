import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PDFViewer from './PDFViewer';
import PortfolioSkeleton from './PortfolioSkeleton';
import ToastContainer from '../common/ToastContainer';
import TruncatedText from '../common/TruncatedText';
import CharacterCounter from '../common/CharacterCounter';
import useToast from '../../hooks/useToast';
import { API_BASE_URL_EXPORT } from '../../data/api';
import '../../styles/Portfolio.css';

const PortfolioManager = () => {
  const { token } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Character limits for form inputs
  const CHARACTER_LIMITS = {
    title: 80,
    description: 500,
    project_type: 30,
    portfolio_url: 200
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    portfolio_url: '',
  });
  const [selectedFiles, setSelectedFiles] = useState({
    pdf: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPDF, setCurrentPDF] = useState({ url: '', filename: '' });
  const [operationLoading, setOperationLoading] = useState(null);

  // Fetch portfolios on component mount
  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL_EXPORT}/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.data || []);
      } else {
        throw new Error('Failed to fetch portfolios');
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      showError('Failed to load portfolio items');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file && file.type === 'application/pdf') {
      setSelectedFiles({ pdf: file });
    } else {
      showError('Please select a valid PDF file');
      e.target.value = '';
    }
  };

  const handleViewPDF = (portfolio) => {
    // Use direct backend URL to bypass React router
    const pdfUrl = `http://localhost:5000/api/portfolio/uploads/${portfolio.pdf_filename}`;
    console.log('Opening PDF via direct backend URL:', pdfUrl);
    setCurrentPDF({
      url: pdfUrl,
      filename: portfolio.pdf_filename
    });
    setShowPDFViewer(true);
  };

  const closePDFViewer = () => {
    setShowPDFViewer(false);
    setCurrentPDF({ url: '', filename: '' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_type: '',
      portfolio_url: '',
    });
    setSelectedFiles({ pdf: null });
    setEditingPortfolio(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      showError('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      setUploadProgress(30);

      // Append PDF file
      if (selectedFiles.pdf) {
        formDataToSend.append('pdf', selectedFiles.pdf);
      }

      setUploadProgress(70);

      const url = editingPortfolio 
        ? `/api/portfolio/${editingPortfolio.id}`
        : '/api/portfolio';
      
      const method = editingPortfolio ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      setUploadProgress(90);

      if (response.ok) {
        setUploadProgress(100);
        showSuccess(editingPortfolio ? 'Portfolio updated successfully!' : 'Portfolio created successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
          fetchPortfolios();
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save portfolio');
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      showError(error.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (portfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      title: portfolio.title || '',
      description: portfolio.description || '',
      project_type: portfolio.project_type || '',
      portfolio_url: portfolio.portfolio_url || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) {
      return;
    }

    try {
      setOperationLoading(`delete-${id}`);
      const response = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSuccess('Portfolio item deleted successfully!');
        fetchPortfolios();
      } else {
        throw new Error('Failed to delete portfolio item');
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      showError(error.message);
    } finally {
      setOperationLoading(null);
    }
  };

  const renderPortfolioItem = (portfolio) => (
    <div key={portfolio.id} className="portfolio-item">
      <div className="portfolio-header">
        <h3 className="portfolio-title">
          <TruncatedText 
            text={portfolio.title} 
            maxLength={50} 
            inline={true}
            showToggle={false}
            className="portfolio-title-text"
          />
        </h3>
        <div className="portfolio-actions">
          <button 
            className="btn btn-sm btn-outline"
            onClick={() => handleEdit(portfolio)}
            disabled={operationLoading}
          >
            <i className="fas fa-edit"></i> Edit
          </button>
          <button 
            className={`btn btn-sm btn-danger ${operationLoading === `delete-${portfolio.id}` ? 'btn-professional-loading' : ''}`}
            onClick={() => handleDelete(portfolio.id)}
            disabled={operationLoading}
          >
            {operationLoading === `delete-${portfolio.id}` ? (
              <div className="btn-loading-content">
                <div className="btn-spinner"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              <>
                <i className="fas fa-trash"></i> Delete
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="portfolio-content">
        <div className="portfolio-description">
          <TruncatedText 
            text={portfolio.description} 
            maxLength={120} 
            showToggle={true}
            className="description-text"
          />
        </div>
        
        <div className="portfolio-details">
          {portfolio.project_type && (
            <span className="detail-item">
              <i className="fas fa-building"></i>
              <TruncatedText 
                text={portfolio.project_type} 
                maxLength={25} 
                inline={true}
                showToggle={false}
              />
            </span>
          )}
        </div>

        <div className="portfolio-links">
          {portfolio.portfolio_url && (
            <a 
              href={portfolio.portfolio_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="portfolio-link"
            >
              <i className="fas fa-external-link-alt"></i>
              View Project
            </a>
          )}
          {portfolio.pdf_path && (
            <button 
              onClick={() => handleViewPDF(portfolio)}
              className="portfolio-link pdf-link"
            >
              <i className="fas fa-file-pdf"></i>
              View PDF
            </button>
          )}
        </div>
      </div>
      
      <div className="portfolio-footer">
        <small>Created: {new Date(portfolio.created_at).toLocaleDateString()}</small>
      </div>
    </div>
  );

  return (
    <div className="portfolio-manager">
      <div className="portfolio-header-section">
        <h2>Portfolio Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus"></i>
          Add Portfolio Item
        </button>
      </div>

      {loading && !showAddModal && (
        <PortfolioSkeleton type="grid" count={3} />
      )}

      <div className="portfolio-grid">
        {portfolios.length === 0 && !loading ? (
          <div className="empty-state">
            <i className="fas fa-images"></i>
            <h3>No portfolio items yet</h3>
            <p>Showcase your best work to attract potential clients.</p>
          </div>
        ) : (
          portfolios.map(renderPortfolioItem)
        )}
      </div>

      {/* Add/Edit Portfolio Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loading && (
              <div className="professional-loading-overlay">
                <div className="professional-loading-content">
                  <div className="professional-loading-spinner"></div>
                  <div className="professional-loading-title">
                    {editingPortfolio ? 'Updating Portfolio' : 'Adding Portfolio'}
                  </div>
                  <div className="professional-loading-subtitle">
                    Please wait while we process your request...
                  </div>
                  <div className="professional-loading-progress">
                    <div className="professional-loading-progress-bar"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-header">
              <h3>{editingPortfolio ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h3>
              <button 
                className="modal-close"
                onClick={() => !loading && setShowAddModal(false)}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="portfolio-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={CHARACTER_LIMITS.title}
                    required
                    disabled={loading}
                    placeholder="Enter a descriptive title for your project"
                  />
                  <CharacterCounter 
                    current={formData.title.length}
                    max={CHARACTER_LIMITS.title}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="project_type">Project Type</label>
                  <select
                    id="project_type"
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={CHARACTER_LIMITS.description}
                  required
                  disabled={loading}
                  placeholder="Describe your project in detail, including key features and achievements"
                />
                <CharacterCounter 
                  current={formData.description.length}
                  max={CHARACTER_LIMITS.description}
                />
              </div>

              <div className="form-group">
                <label htmlFor="portfolio_url">Project Website/Link</label>
                <input
                  type="url"
                  id="portfolio_url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  maxLength={CHARACTER_LIMITS.portfolio_url}
                  placeholder="https://example.com/project"
                  disabled={loading}
                />
                <CharacterCounter 
                  current={formData.portfolio_url.length}
                  max={CHARACTER_LIMITS.portfolio_url}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pdf">Portfolio PDF</label>
                <input
                  type="file"
                  id="pdf"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <small>Upload a PDF document showcasing this project</small>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{uploadProgress}% uploaded</span>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {editingPortfolio ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      {editingPortfolio ? 'Update Portfolio' : 'Create Portfolio'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && (
        <PDFViewer
          pdfUrl={currentPDF.url}
          filename={currentPDF.filename}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PortfolioManager;
