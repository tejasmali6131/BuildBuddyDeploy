const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database-sqlite');

const router = express.Router();

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    
    req.user = decoded;
    next();
  });
};

// POST /api/bids - Submit a bid for a project
router.post('/', authenticateToken, (req, res) => {
  console.log('=== POST /api/bids endpoint called ===');
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);

  // Only allow architects to submit bids
  if (req.user.userType !== 'architect') {
    return res.status(403).json({ message: 'Access denied. Architect access required.' });
  }

  const {
    project_id,
    bid_amount,
    estimated_duration,
    proposal_description,
    experience_note
  } = req.body;

  const architectId = req.user.userId;

  // Validate required fields
  if (!project_id || !bid_amount || !estimated_duration || !proposal_description) {
    return res.status(400).json({ 
      message: 'Missing required fields: project_id, bid_amount, estimated_duration, proposal_description' 
    });
  }

  // Check if project exists and is open for bids
  const projectQuery = 'SELECT * FROM projects WHERE id = ? AND status = ?';
  
  db.get(projectQuery, [project_id, 'open'], (err, project) => {
    if (err) {
      console.error('Database error when checking project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not accepting bids' });
    }

    // Check if architect already submitted a bid for this project
    const existingBidQuery = 'SELECT id FROM project_bids WHERE project_id = ? AND architect_id = ?';
    
    db.get(existingBidQuery, [project_id, architectId], (err, existingBid) => {
      if (err) {
        console.error('Database error when checking existing bid:', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (existingBid) {
        return res.status(400).json({ message: 'You have already submitted a bid for this project' });
      }

        // Insert the new bid
        const insertQuery = `
          INSERT INTO project_bids (
            project_id, architect_id, bid_amount, estimated_duration,
            proposal_description, experience_note, status, submitted_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        const bidStatus = 'pending';

        db.run(insertQuery, [
          project_id, architectId, bid_amount, estimated_duration,
          proposal_description, experience_note, bidStatus
        ], function(err) {
          if (err) {
            console.error('Database error when inserting bid:', err.message);
            return res.status(500).json({ error: err.message });
          }

          console.log('Bid created successfully with ID:', this.lastID);

          // Fetch the created bid with architect information (simplified query)
          const fetchBidQuery = `
            SELECT b.*, 
                   u.first_name as architect_first_name,
                   u.last_name as architect_last_name,
                   u.email as architect_email
            FROM project_bids b
            JOIN users u ON b.architect_id = u.id
            WHERE b.id = ?
          `;
          
          db.get(fetchBidQuery, [this.lastID], (err, bid) => {
            if (err) {
              console.error('Database error when fetching created bid:', err.message);
              console.error('Query that failed:', fetchBidQuery);
              console.error('Parameters:', [this.lastID]);
              return res.status(500).json({ error: err.message });
            }

            console.log('Bid fetched successfully:', bid);
            res.status(201).json({ 
              message: 'Bid submitted successfully',
              bid: bid
            });
          });
        });
    });
  });
});

// PUT /api/bids/:id/status - Update bid status (accept/reject)
router.put('/:id/status', authenticateToken, (req, res) => {
  console.log('=== PUT /api/bids/:id/status endpoint called ===');
  const bidId = req.params.id;
  const { status } = req.body;
  const userId = req.user.userId;
  const userType = req.user.userType;

  // Only allow customers to update bid status
  if (userType !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  // Validate status
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
  }

  // Check if bid exists and user owns the project
  const checkQuery = `
    SELECT b.*, p.customer_id 
    FROM project_bids b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = ?
  `;

  db.get(checkQuery, [bidId], (err, bid) => {
    if (err) {
      console.error('Database error when checking bid:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.customer_id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only update bids for your own projects.' });
    }

    // Update bid status
    const updateQuery = 'UPDATE project_bids SET status = ?, updated_at = datetime(\'now\') WHERE id = ?';

    db.run(updateQuery, [status, bidId], function(err) {
      if (err) {
        console.error('Database error when updating bid status:', err.message);
        return res.status(500).json({ error: err.message });
      }

      // If bid is accepted, update project status and reject other bids
      if (status === 'accepted') {
        // Update project status to 'in_progress'
        const updateProjectQuery = 'UPDATE projects SET status = ?, updated_at = datetime(\'now\') WHERE id = ?';
        
        db.run(updateProjectQuery, ['in_progress', bid.project_id], (err) => {
          if (err) {
            console.error('Database error when updating project status:', err.message);
            return res.status(500).json({ error: err.message });
          }

          // Reject all other bids for this project
          const rejectOtherBidsQuery = `
            UPDATE project_bids 
            SET status = 'rejected', updated_at = datetime('now') 
            WHERE project_id = ? AND id != ? AND status = 'pending'
          `;

          db.run(rejectOtherBidsQuery, [bid.project_id, bidId], (err) => {
            if (err) {
              console.error('Database error when rejecting other bids:', err.message);
            }

            res.json({ 
              message: `Bid ${status} successfully`,
              bid: { ...bid, status }
            });
          });
        });
      } else {
        res.json({ 
          message: `Bid ${status} successfully`,
          bid: { ...bid, status }
        });
      }
    });
  });
});

// GET /api/bids/my-bids - Get architect's own bids
router.get('/my-bids', authenticateToken, (req, res) => {
  console.log('=== GET /api/bids/my-bids endpoint called ===');

  // Only allow architects to view their bids
  if (req.user.userType !== 'architect') {
    return res.status(403).json({ message: 'Access denied. Architect access required.' });
  }

  const architectId = req.user.userId;

  const query = `
    SELECT b.*, 
           p.title as project_title,
           p.description as project_description,
           p.location as project_location,
           p.budget_min,
           p.budget_max,
           u.first_name as customer_first_name,
           u.last_name as customer_last_name,
           u.email as customer_email
    FROM project_bids b
    JOIN projects p ON b.project_id = p.id
    JOIN users u ON p.customer_id = u.id
    WHERE b.architect_id = ?
    ORDER BY b.submitted_at DESC
  `;

  db.all(query, [architectId], (err, bids) => {
    if (err) {
      console.error('Database error when fetching architect bids:', err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json({ bids: bids || [] });
  });
});

// GET /api/bids/dashboard-stats - Get architect dashboard statistics
router.get('/dashboard-stats', authenticateToken, (req, res) => {
  console.log('=== GET /api/bids/dashboard-stats endpoint called ===');

  // Only allow architects to view their dashboard stats
  if (req.user.userType !== 'architect') {
    return res.status(403).json({ message: 'Access denied. Architect access required.' });
  }

  const architectId = req.user.userId;

  // Query for active projects (accepted bids with projects currently in progress)
  const activeProjectsQuery = `
    SELECT COUNT(*) as count
    FROM project_bids b
    JOIN projects p ON b.project_id = p.id
    WHERE b.architect_id = ? AND b.status = 'accepted' AND p.status = 'in_progress'
  `;

  // Query for total clients (unique customers from accepted bids)
  const totalClientsQuery = `
    SELECT COUNT(DISTINCT p.customer_id) as count
    FROM project_bids b
    JOIN projects p ON b.project_id = p.id
    WHERE b.architect_id = ? AND b.status = 'accepted'
  `;

  // Query for total ratings (from actual ratings table)
  const totalRatingsQuery = `
    SELECT COUNT(*) as count
    FROM ratings r
    WHERE r.architect_id = ?
  `;

  // Query for new inquiries (pending bids from last 30 days)
  const newInquiriesQuery = `
    SELECT COUNT(*) as count
    FROM project_bids b
    WHERE b.architect_id = ? 
    AND b.status = 'pending' 
    AND date(b.submitted_at) >= date('now', '-30 days')
  `;

  // Execute all queries
  db.get(activeProjectsQuery, [architectId], (err, activeProjects) => {
    if (err) {
      console.error('Error fetching active projects:', err.message);
      return res.status(500).json({ error: err.message });
    }

    db.get(totalClientsQuery, [architectId], (err, totalClients) => {
      if (err) {
        console.error('Error fetching total clients:', err.message);
        return res.status(500).json({ error: err.message });
      }

      db.get(totalRatingsQuery, [architectId], (err, totalRatings) => {
        if (err) {
          console.error('Error fetching total ratings:', err.message);
          return res.status(500).json({ error: err.message });
        }

        db.get(newInquiriesQuery, [architectId], (err, newInquiries) => {
          if (err) {
            console.error('Error fetching new inquiries:', err.message);
            return res.status(500).json({ error: err.message });
          }

          const stats = {
            activeProjects: activeProjects.count || 0,
            totalClients: totalClients.count || 0,
            totalRatings: totalRatings.count || 0,
            newInquiries: newInquiries.count || 0
          };

          console.log('Architect dashboard stats:', stats);
          res.json(stats);
        });
      });
    });
  });
});

module.exports = router;