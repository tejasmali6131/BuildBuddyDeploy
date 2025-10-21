const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { db } = require('../config/database-sqlite');
const Portfolio = require('../models/Portfolio');
const Rating = require('../models/Rating');

// GET /api/architects/:id/profile - Get architect profile information
router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const architectId = req.params.id;
    console.log('Fetching profile for architect ID:', architectId);

    // Get architect user and profile data
    const profileQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.user_type,
        u.created_at,
        ap.company_name,
        ap.license_number,
        ap.years_experience,
        ap.specialization,
        ap.portfolio_url,
        ap.bio,
        ap.hourly_rate,
        ap.availability_status
      FROM users u
      LEFT JOIN architect_profiles ap ON u.id = ap.user_id
      WHERE u.id = ? AND u.user_type = 'architect'
    `;

    db.get(profileQuery, [architectId], (err, profile) => {
      if (err) {
        console.error('Database error when fetching architect profile:', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!profile) {
        return res.status(404).json({ message: 'Architect not found' });
      }

      // Return profile data
      res.json({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        company_name: profile.company_name,
        license_number: profile.license_number,
        years_experience: profile.years_experience,
        specialization: profile.specialization,
        portfolio_url: profile.portfolio_url,
        bio: profile.bio,
        hourly_rate: profile.hourly_rate,
        availability_status: profile.availability_status,
        website: profile.portfolio_url, // For compatibility
        description: profile.bio, // For compatibility
        created_at: profile.created_at
      });
    });

  } catch (error) {
    console.error('Error fetching architect profile:', error);
    res.status(500).json({ error: 'Failed to fetch architect profile' });
  }
});

// GET /api/architects/:id/ratings - Get architect ratings and reviews
router.get('/:id/ratings', authenticateToken, async (req, res) => {
  try {
    const architectId = req.params.id;
    console.log('Fetching ratings for architect ID:', architectId);

    const ratingModel = new Rating();
    
    // Get both ratings and summary
    const [ratings, summary] = await Promise.all([
      ratingModel.getRatingsByArchitect(architectId),
      ratingModel.getArchitectRatingSummary(architectId)
    ]);

    res.json({
      ratings,
      summary: {
        ...summary,
        recommendation_percentage: summary.recommendation_percentage || 0
      }
    });

  } catch (error) {
    console.error('Error fetching architect ratings:', error);
    res.status(500).json({ error: 'Failed to fetch architect ratings' });
  }
});

// GET /api/architects/:id/completed-projects - Get architect's completed projects
router.get('/:id/completed-projects', authenticateToken, async (req, res) => {
  try {
    const architectId = req.params.id;
    console.log('Fetching completed projects for architect ID:', architectId);

    // Get completed projects for this architect on BuildBuddy platform
    const projectsQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.project_type,
        p.location,
        p.area_sqft,
        p.budget_min,
        p.budget_max,
        p.created_at,
        p.updated_at as completed_date,
        pb.bid_amount,
        r.rating,
        r.review_text
      FROM projects p
      JOIN project_bids pb ON p.id = pb.project_id
      LEFT JOIN ratings r ON p.id = r.project_id AND r.architect_id = ?
      WHERE pb.architect_id = ? 
        AND pb.status = 'accepted' 
        AND p.status = 'completed'
      ORDER BY p.updated_at DESC
    `;

    db.all(projectsQuery, [architectId, architectId], (err, projects) => {
      if (err) {
        console.error('Database error when fetching completed projects:', err.message);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        projects: projects || []
      });
    });

  } catch (error) {
    console.error('Error fetching completed projects:', error);
    res.status(500).json({ error: 'Failed to fetch completed projects' });
  }
});

module.exports = router;