import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import '../../styles/RatingModal.css';

const RatingModal = ({ isOpen, onClose, project, architect, onSubmit }) => {
  const { showSuccess, showError } = useToast();
  const [ratingData, setRatingData] = useState({
    rating: 0,
    review_text: '',
    communication_rating: 0,
    design_quality_rating: 0,
    timeliness_rating: 0,
    value_rating: 0,
    would_recommend: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipRating, setSkipRating] = useState(false);

  const handleStarClick = (category, rating) => {
    setRatingData(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const renderStarRating = (category, label) => {
    const rating = ratingData[category];
    const isRequired = label.includes('*');
    
    return (
      <div className="rating-category">
        <label className={isRequired ? 'required' : ''}>{label}</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fa-star ${star <= rating ? 'fas' : 'far'}`}
              onClick={() => handleStarClick(category, star)}
            />
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!skipRating) {
      // Validate required ratings - all categories are now compulsory
      if (ratingData.rating === 0) {
        showError('Please provide an overall rating');
        return;
      }
      if (ratingData.communication_rating === 0) {
        showError('Please provide a communication rating');
        return;
      }
      if (ratingData.design_quality_rating === 0) {
        showError('Please provide a design quality rating');
        return;
      }
      if (ratingData.timeliness_rating === 0) {
        showError('Please provide a timeliness rating');
        return;
      }
      if (ratingData.value_rating === 0) {
        showError('Please provide a value for money rating');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(skipRating ? null : ratingData);
      onClose();
      showSuccess(skipRating ? 'Project marked as completed' : 'Thank you for your rating!');
    } catch (error) {
      showError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = skipRating || (
    ratingData.rating > 0 && 
    ratingData.communication_rating > 0 && 
    ratingData.design_quality_rating > 0 && 
    ratingData.timeliness_rating > 0 && 
    ratingData.value_rating > 0
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Project Completed!</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="project-info">
            <h3>{project?.title}</h3>
            <p>Architect: {architect?.first_name} {architect?.last_name}</p>
          </div>

          <div className="rating-options">
            <div className="option-toggle">
              <label>
                <input
                  type="radio"
                  name="rating_choice"
                  checked={!skipRating}
                  onChange={() => setSkipRating(false)}
                />
                Rate this architect
              </label>
              <label>
                <input
                  type="radio" 
                  name="rating_choice"
                  checked={skipRating}
                  onChange={() => setSkipRating(true)}
                />
                Skip rating for now
              </label>
            </div>

            {!skipRating && (
              <div className="rating-form">
                <div className="form-info">
                  <p><i className="fas fa-info-circle"></i> All rating categories are required to submit your review.</p>
                </div>
                {renderStarRating('rating', 'Overall Rating *')}
                {renderStarRating('communication_rating', 'Communication *')}
                {renderStarRating('design_quality_rating', 'Design Quality *')}
                {renderStarRating('timeliness_rating', 'Timeliness *')}
                {renderStarRating('value_rating', 'Value for Money *')}

                <div className="review-section">
                  <label>Review (Optional)</label>
                  <textarea
                    value={ratingData.review_text}
                    onChange={(e) => setRatingData(prev => ({
                      ...prev,
                      review_text: e.target.value
                    }))}
                    placeholder="Share your experience working with this architect..."
                    rows="4"
                  />
                </div>

                <div className="recommendation-section">
                  <label>
                    <input
                      type="checkbox"
                      checked={ratingData.would_recommend}
                      onChange={(e) => setRatingData(prev => ({
                        ...prev,
                        would_recommend: e.target.checked
                      }))}
                    />
                    I would recommend this architect to others
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : skipRating ? 'Mark as Completed' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;