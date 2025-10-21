const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const auth = require('../middleware/auth');

// Create a new rating (customers only)
router.post('/create', auth, async (req, res) => {
  try {
    const {
      project_id,
      architect_id,
      rating,
      review_text,
      communication_rating,
      design_quality_rating,
      timeliness_rating,
      value_rating,
      would_recommend
    } = req.body;

    const customer_id = req.user.id;

    // Validation
    if (!project_id || !architect_id || !rating) {
      return res.status(400).json({ error: 'Project ID, architect ID, and overall rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const ratingModel = new Rating();
    const newRating = await ratingModel.createRating({
      project_id,
      architect_id,
      customer_id,
      rating,
      review_text: review_text || '',
      communication_rating: communication_rating || null,
      design_quality_rating: design_quality_rating || null,
      timeliness_rating: timeliness_rating || null,
      value_rating: value_rating || null,
      would_recommend: would_recommend || false
    });

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });

  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get ratings for an architect
router.get('/architect/:architectId', async (req, res) => {
  try {
    const { architectId } = req.params;
    const ratingModel = new Rating();

    const [ratings, summary] = await Promise.all([
      ratingModel.getRatingsByArchitect(architectId),
      ratingModel.getArchitectRatingSummary(architectId)
    ]);

    res.json({
      ratings,
      summary: {
        ...summary,
        average_rating: summary.average_rating ? parseFloat(summary.average_rating).toFixed(1) : 0,
        avg_communication: summary.avg_communication ? parseFloat(summary.avg_communication).toFixed(1) : 0,
        avg_design_quality: summary.avg_design_quality ? parseFloat(summary.avg_design_quality).toFixed(1) : 0,
        avg_timeliness: summary.avg_timeliness ? parseFloat(summary.avg_timeliness).toFixed(1) : 0,
        avg_value: summary.avg_value ? parseFloat(summary.avg_value).toFixed(1) : 0,
        recommendation_percentage: summary.total_ratings > 0 ? 
          ((summary.recommendations / summary.total_ratings) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching architect ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get my ratings (for authenticated architect)
router.get('/my-ratings', auth, async (req, res) => {
  try {
    if (req.user.user_type !== 'architect') {
      return res.status(403).json({ error: 'Access denied. Architects only.' });
    }

    const architectId = req.user.id;
    const ratingModel = new Rating();

    const [ratings, summary] = await Promise.all([
      ratingModel.getRatingsByArchitect(architectId),
      ratingModel.getArchitectRatingSummary(architectId)
    ]);

    res.json({
      ratings,
      summary: {
        ...summary,
        average_rating: summary.average_rating ? parseFloat(summary.average_rating).toFixed(1) : 0,
        total_ratings: summary.total_ratings || 0,
        avg_communication: summary.avg_communication ? parseFloat(summary.avg_communication).toFixed(1) : 0,
        avg_design_quality: summary.avg_design_quality ? parseFloat(summary.avg_design_quality).toFixed(1) : 0,
        avg_timeliness: summary.avg_timeliness ? parseFloat(summary.avg_timeliness).toFixed(1) : 0,
        avg_value: summary.avg_value ? parseFloat(summary.avg_value).toFixed(1) : 0,
        five_star: summary.five_star || 0,
        four_star: summary.four_star || 0,
        three_star: summary.three_star || 0,
        two_star: summary.two_star || 0,
        one_star: summary.one_star || 0,
        recommendation_percentage: summary.total_ratings > 0 ? 
          ((summary.recommendations / summary.total_ratings) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching my ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Mark project as completed (customers and architects)
router.post('/complete-project', auth, async (req, res) => {
  try {
    const { project_id, architect_id, completion_notes } = req.body;
    let customer_id, completedBy;

    if (req.user.user_type === 'architect') {
      // Architect completing project - need customer_id in body
      customer_id = req.body.customer_id;
      completedBy = req.user.id;
      if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required for architect completion' });
      }
    } else if (req.user.user_type === 'customer') {
      // Customer completing project - use their ID
      customer_id = req.user.id;
      completedBy = req.user.id;
      if (!architect_id) {
        return res.status(400).json({ error: 'Architect ID is required for customer completion' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied. Only customers and architects can complete projects.' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const ratingModel = new Rating();
    const result = await ratingModel.markProjectCompleted(
      project_id, 
      architect_id, 
      customer_id, 
      completion_notes || `Project marked as completed by ${req.user.user_type}`
    );

    res.status(201).json({
      message: 'Project marked as completed successfully',
      completion: result
    });

  } catch (error) {
    console.error('Error marking project as completed:', error);
    res.status(500).json({ error: 'Failed to mark project as completed' });
  }
});

// Get completed projects awaiting rating (customers only)
router.get('/pending-ratings', auth, async (req, res) => {
  try {
    if (req.user.user_type !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Customers only.' });
    }

    const customerId = req.user.id;
    const ratingModel = new Rating();
    const projects = await ratingModel.getCompletedProjectsAwaitingRating(customerId);

    res.json({
      projects
    });

  } catch (error) {
    console.error('Error fetching pending ratings:', error);
    res.status(500).json({ error: 'Failed to fetch pending ratings' });
  }
});

// Get completed projects for architect
router.get('/completed-projects', auth, async (req, res) => {
  console.log('🔍 /completed-projects called by user:', req.user);
  try {
    if (req.user.user_type !== 'architect') {
      console.log('❌ Access denied - not architect, user type:', req.user.user_type);
      return res.status(403).json({ error: 'Access denied. Architects only.' });
    }

    const architectId = req.user.id;
    console.log('✅ Fetching completed projects for architect ID:', architectId);
    const ratingModel = new Rating();
    const projects = await ratingModel.getCompletedProjectsByArchitect(architectId);

    res.json({
      projects
    });

  } catch (error) {
    console.error('Error fetching completed projects:', error);
    res.status(500).json({ error: 'Failed to fetch completed projects' });
  }
});

module.exports = router;