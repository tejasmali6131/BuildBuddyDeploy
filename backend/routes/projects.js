const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database-sqlite');
const path = require('path');

const router = express.Router();

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  // Use the same secret key as auth.js
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    
    console.log('Token decoded successfully:', {
      userId: decoded.userId,
      userType: decoded.userType,
      email: decoded.email
    });
    
    req.user = decoded;
    next();
  });
};

// GET /api/projects - Get projects based on user type
router.get('/', authenticateToken, (req, res) => {
  console.log('=== GET /api/projects endpoint called ===');
  console.log('Authenticated user:', req.user);
  console.log('Query parameters:', req.query);
  
  const userId = req.user.userId;
  const userEmail = req.user.email;
  const userType = req.user.userType;
  
  // Extract filter parameters
  const {
    status,
    project_type,
    location,
    priority,
    customer_name,
    budget_min,
    budget_max,
    area_min,
    area_max
  } = req.query;
  
  let query, queryParams = [];
  let whereConditions = [];
  
  if (userType === 'customer') {
    // Customers see only their own projects with bid counts
    console.log('Fetching projects for customer:', { id: userId, email: userEmail });
    
    query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.project_type,
        p.location,
        p.area_sqft,
        p.budget_min,
        p.budget_max,
        p.timeline,
        p.requirements,
        p.priority,
        p.status,
        p.customer_id,
        p.customer_email,
        p.created_at,
        (u.first_name || ' ' || u.last_name) as customer_name,
        COUNT(pb.id) as bid_count,
        accepted_bids.bid_amount as accepted_bid_amount,
        accepted_bids.architect_id as accepted_architect_id,
        (accepted_architect.first_name || ' ' || accepted_architect.last_name) as accepted_architect_name
      FROM projects p
      LEFT JOIN users u ON p.customer_id = u.id
      LEFT JOIN project_bids pb ON p.id = pb.project_id
      LEFT JOIN (
        SELECT project_id, bid_amount, architect_id
        FROM project_bids 
        WHERE status = 'accepted'
      ) accepted_bids ON p.id = accepted_bids.project_id
      LEFT JOIN users accepted_architect ON accepted_bids.architect_id = accepted_architect.id
      WHERE (p.customer_email = ? OR p.customer_id = ?)
    `; 
    queryParams = [userEmail, userId];
    
  } else if (userType === 'architect') {
    // Architects see different projects based on status filter
  console.log('=== ARCHITECT PROJECTS REQUEST ===');
  console.log('Architect ID:', userId); 
  console.log('Architect Email:', userEmail);
  console.log('Requested Status Filter:', status);
  console.log('All Query Parameters:', req.query);
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);    // If filtering for in_progress or completed projects, only show projects this architect is working on
    if (status && ['in_progress', 'completed'].includes(status)) {
      console.log(`Fetching ${status} projects where architect has accepted bid`);
      query = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.project_type,
          p.location,
          p.area_sqft,
          p.budget_min,
          p.budget_max,
          p.timeline,
          p.requirements,
          p.priority,
          p.status,
          p.customer_id,
          p.customer_email,
          p.created_at,
          (u.first_name || ' ' || u.last_name) as customer_name,
          COUNT(pb_all.id) as bid_count,
          my_bid.bid_amount as accepted_bid_amount
        FROM projects p
        LEFT JOIN users u ON p.customer_id = u.id
        LEFT JOIN project_bids pb_all ON p.id = pb_all.project_id
        INNER JOIN project_bids my_bid ON p.id = my_bid.project_id 
          AND my_bid.architect_id = ? AND my_bid.status = 'accepted'
        WHERE p.status = ?
      `;
      queryParams = [userId, status];
    } else {
      // For open projects or no status filter, show only:
      // 1. Open projects (available for bidding)
      // 2. Projects where this architect has accepted bids (their own projects)
      console.log('Fetching open projects and architect own projects');
      query = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.project_type,
          p.location,
          p.area_sqft,
          p.budget_min,
          p.budget_max,
          p.timeline,
          p.requirements,
          p.priority,
          p.status,
          p.customer_id,
          p.customer_email,
          p.created_at,
          (u.first_name || ' ' || u.last_name) as customer_name,
          COUNT(pb_all.id) as bid_count,
          COALESCE(my_bid.bid_amount, accepted_bids.bid_amount) as accepted_bid_amount
        FROM projects p
        LEFT JOIN users u ON p.customer_id = u.id
        LEFT JOIN project_bids pb_all ON p.id = pb_all.project_id
        LEFT JOIN project_bids my_bid ON p.id = my_bid.project_id 
          AND my_bid.architect_id = ? AND my_bid.status = 'accepted'
        LEFT JOIN (
          SELECT project_id, bid_amount 
          FROM project_bids 
          WHERE status = 'accepted'
        ) accepted_bids ON p.id = accepted_bids.project_id
        WHERE (p.status = 'open' OR my_bid.id IS NOT NULL)
      `;
      queryParams = [userId];
    }
    
  } else {
    console.log('Access denied: Invalid user type:', userType);
    return res.status(403).json({ message: 'Access denied. Invalid user type.' });
  }

  // Add filter conditions
  // Note: For architects with in_progress/completed status, the status filter is already applied above
  if (status && !(userType === 'architect' && ['in_progress', 'completed'].includes(status))) {
    query += ' AND p.status = ?';
    queryParams.push(status);
  }
  
  if (project_type) {
    query += ' AND p.project_type = ?';
    queryParams.push(project_type);
  }
  
  if (location) {
    query += ' AND p.location = ?';
    queryParams.push(location);
  }
  
  if (priority) {
    query += ' AND p.priority = ?';
    queryParams.push(priority);
  }
  
  if (customer_name) {
    query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR (u.first_name || " " || u.last_name) LIKE ?)';
    const namePattern = `%${customer_name}%`;
    queryParams.push(namePattern, namePattern, namePattern);
  }
  
  if (budget_min) {
    query += ' AND p.budget_min >= ?';
    queryParams.push(parseInt(budget_min));
  }
  
  if (budget_max) {
    query += ' AND p.budget_max <= ?';
    queryParams.push(parseInt(budget_max));
  }
  
  if (area_min) {
    query += ' AND p.area_sqft >= ?';
    queryParams.push(parseInt(area_min));
  }
  
  if (area_max) {
    query += ' AND p.area_sqft <= ?';
    queryParams.push(parseInt(area_max));
  }
  
  // Add GROUP BY clause for both customer and architect queries (since both have bid_count)
  if (userType === 'customer' || userType === 'architect') {
    if (userType === 'architect' && status && ['in_progress', 'completed'].includes(status)) {
      // For architect in_progress/completed queries with INNER JOIN
      query += ` GROUP BY p.id, p.title, p.description, p.project_type, p.location, p.area_sqft, 
                 p.budget_min, p.budget_max, p.timeline, p.requirements, p.priority, 
                 p.status, p.customer_id, p.customer_email, p.created_at, u.first_name, u.last_name, my_bid.bid_amount`;
    } else {
      // For other queries with LEFT JOIN (including customer queries)
      if (userType === 'customer') {
        // Customer queries need architect fields in GROUP BY
        query += ` GROUP BY p.id, p.title, p.description, p.project_type, p.location, p.area_sqft, 
                   p.budget_min, p.budget_max, p.timeline, p.requirements, p.priority, 
                   p.status, p.customer_id, p.customer_email, p.created_at, u.first_name, u.last_name,
                   accepted_bids.architect_id, accepted_architect.first_name, accepted_architect.last_name`;
      } else {
        // Architect queries without accepted bid details
        query += ` GROUP BY p.id, p.title, p.description, p.project_type, p.location, p.area_sqft, 
                   p.budget_min, p.budget_max, p.timeline, p.requirements, p.priority, 
                   p.status, p.customer_id, p.customer_email, p.created_at, u.first_name, u.last_name`;
      }
    }
  }
  
  // Add ordering
  query += ' ORDER BY p.created_at DESC';
  
  console.log('Final query:', query);
  console.log('Query parameters:', queryParams);

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      console.error('Database error when fetching projects:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`=== QUERY RESULTS ===`);
    console.log(`Found ${rows.length} projects for query`);
    if (rows.length > 0 && rows.length <= 5) {
      console.log('Sample results:', rows.map(r => ({ id: r.id, title: r.title, status: r.status })));
    }

    console.log('Database query completed. Found projects:', rows.length);
    
    // Debug: Log bid counts specifically
    rows.forEach((project, index) => {
      console.log(`Project ${index + 1}: "${project.title}" - bid_count: ${project.bid_count} (type: ${typeof project.bid_count})`);
    });

    // Return in the format the frontend expects
    res.json({ projects: rows });
  });
});

// POST /api/projects - Create a new project
router.post('/', authenticateToken, (req, res) => {
  console.log('=== POST /api/projects endpoint called ===');
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);

  // Only allow customers to create projects
  if (req.user.userType !== 'customer') {
    console.log('Access denied: User is not a customer');
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  const { title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority } = req.body;
  const customer_id = req.user.userId;
  const customer_email = req.user.email;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  // Provide defaults for required fields
  const projectData = {
    title: title,
    description: description,
    project_type: project_type || 'General',
    location: location || 'Not specified',
    area_sqft: area_sqft || 0,
    budget_min: budget_min || 0,
    budget_max: budget_max || 0,
    timeline: timeline || null,
    requirements: requirements || null,
    priority: priority || 'medium',
    customer_id: customer_id,
    customer_email: customer_email
  };

  console.log('Creating project for customer:', { id: customer_id, email: customer_email });
  console.log('Project data:', projectData);

  const query = `
    INSERT INTO projects (title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority, customer_id, customer_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    projectData.title, 
    projectData.description, 
    projectData.project_type, 
    projectData.location, 
    projectData.area_sqft, 
    projectData.budget_min, 
    projectData.budget_max, 
    projectData.timeline, 
    projectData.requirements, 
    projectData.priority, 
    projectData.customer_id,
    projectData.customer_email
  ], function(err) {
    if (err) {
      console.error('Database error when creating project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log('Project created successfully with ID:', this.lastID);

    // Fetch the created project with customer name
    const selectQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.project_type,
        p.location,
        p.area_sqft,
        p.budget_min,
        p.budget_max,
        p.timeline,
        p.requirements,
        p.priority,
        p.status,
        p.customer_id,
        p.customer_email,
        p.created_at,
        (u.first_name || ' ' || u.last_name) as customer_name
      FROM projects p
      LEFT JOIN users u ON p.customer_id = u.id
      WHERE p.id = ?
    `;

    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created project:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('Returning created project:', row);
      res.status(201).json(row);
    });
  });
});

// PUT /api/projects/:id - Update a project
router.put('/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  const { title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority, status } = req.body;
  
  console.log('=== PUT /api/projects/:id endpoint called ===');
  console.log('Project ID:', projectId);
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);

  // Only allow customers to update their own projects
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  // First check if project exists and belongs to the customer
  const checkQuery = 'SELECT * FROM projects WHERE id = ? AND customer_id = ?';
  
  db.get(checkQuery, [projectId, req.user.userId], (err, project) => {
    if (err) {
      console.error('Database error when checking project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Update the project
    const updateQuery = `
      UPDATE projects 
      SET title = ?, description = ?, project_type = ?, location = ?, area_sqft = ?, 
          budget_min = ?, budget_max = ?, timeline = ?, requirements = ?, priority = ?, status = ?
      WHERE id = ? AND customer_id = ?
    `;

    db.run(updateQuery, [title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority, status, projectId, req.user.userId], function(err) {
      if (err) {
        console.error('Database error when updating project:', err.message);
        return res.status(500).json({ error: err.message });
      }

      // Fetch the updated project with customer name
      const selectQuery = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.project_type,
          p.location,
          p.area_sqft,
          p.budget_min,
          p.budget_max,
          p.timeline,
          p.requirements,
          p.priority,
          p.status,
          p.customer_id,
          p.customer_email,
          p.created_at,
          (u.first_name || ' ' || u.last_name) as customer_name
        FROM projects p
        LEFT JOIN users u ON p.customer_id = u.id
        WHERE p.id = ?
      `;

      db.get(selectQuery, [projectId], (err, row) => {
        if (err) {
          console.error('Error fetching updated project:', err.message);
          return res.status(500).json({ error: err.message });
        }

        console.log('Project updated successfully:', row);
        res.json(row);
      });
    });
  });
});

// PUT /api/projects/:id/cancel - Cancel a project (set status back to open)
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  
  console.log('=== PUT /api/projects/:id/cancel endpoint called ===');
  console.log('Project ID:', projectId);
  console.log('Authenticated user:', req.user);

  // Only allow customers to cancel their own projects
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  // First check if project exists and belongs to the customer
  const checkQuery = 'SELECT * FROM projects WHERE id = ? AND customer_id = ?';
  
  db.get(checkQuery, [projectId, req.user.userId], (err, project) => {
    if (err) {
      console.error('Database error when checking project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Only allow cancelling projects that are in_progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({ 
        message: 'Only projects with "in_progress" status can be cancelled' 
      });
    }

    // Update project status to open and reset accepted bids to rejected
    const updateProjectQuery = `UPDATE projects SET status = 'open' WHERE id = ? AND customer_id = ?`;
    const updateBidsQuery = `UPDATE project_bids SET status = 'rejected' WHERE project_id = ? AND status = 'accepted'`;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(updateProjectQuery, [projectId, req.user.userId], function(err) {
        if (err) {
          console.error('Database error when updating project status:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        db.run(updateBidsQuery, [projectId], function(err) {
          if (err) {
            console.error('Database error when updating bids:', err.message);
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              return res.status(500).json({ error: err.message });
            }

            console.log('Project cancelled successfully, ID:', projectId);
            res.json({ 
              message: 'Project cancelled successfully. Status changed to open and all accepted bids have been rejected.',
              project_id: projectId,
              new_status: 'open'
            });
          });
        });
      });
    });
  });
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  
  console.log('=== DELETE /api/projects/:id endpoint called ===');
  console.log('Project ID:', projectId);
  console.log('Authenticated user:', req.user);

  // Only allow customers to delete their own projects
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  // First check if project exists and belongs to the customer
  const checkQuery = 'SELECT * FROM projects WHERE id = ? AND customer_id = ?';
  
  db.get(checkQuery, [projectId, req.user.userId], (err, project) => {
    if (err) {
      console.error('Database error when checking project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Delete the project
    const deleteQuery = 'DELETE FROM projects WHERE id = ? AND customer_id = ?';
    
    db.run(deleteQuery, [projectId, req.user.userId], function(err) {
      if (err) {
        console.error('Database error when deleting project:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('Project deleted successfully, ID:', projectId);
      res.json({ message: 'Project deleted successfully' });
    });
  });
});

// GET /api/projects/:id - Get project details with bids
router.get('/:id', authenticateToken, (req, res) => {
  console.log('=== GET /api/projects/:id endpoint called ===');
  const projectId = req.params.id;
  const userId = req.user.userId;
  const userType = req.user.userType;
  
  console.log('Project ID:', projectId);
  console.log('User:', { userId, userType });

  // Get project details with customer information
  const projectQuery = `
    SELECT p.*, 
           u.first_name as customer_first_name,
           u.last_name as customer_last_name,
           u.email as customer_email,
           u.email as customer_username,
           u.phone as customer_phone
    FROM projects p
    JOIN users u ON p.customer_id = u.id
    WHERE p.id = ?
  `;

  db.get(projectQuery, [projectId], (err, project) => {
    if (err) {
      console.error('Database error when fetching project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access permissions
    if (userType === 'customer' && project.customer_id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own projects.' });
    }

    // Get bids for this project (only if user is customer or architect)
    const bidsQuery = `
      SELECT b.*, 
             u.first_name as architect_first_name,
             u.last_name as architect_last_name,
             u.email as architect_email,
             ap.company_name,
             ap.license_number,
             ap.years_experience,
             ap.specialization
      FROM project_bids b
      JOIN users u ON b.architect_id = u.id
      LEFT JOIN architect_profiles ap ON u.id = ap.user_id
      WHERE b.project_id = ?
      ORDER BY b.submitted_at DESC
    `;

    db.all(bidsQuery, [projectId], (err, bids) => {
      if (err) {
        console.error('Database error when fetching bids:', err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log('Project details fetched successfully');
      res.json({ 
        project: project,
        bids: bids || []
      });
    });
  });
});

module.exports = router;