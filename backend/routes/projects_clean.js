const express = require('express');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

// Database connection with absolute path
const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

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

// GET /api/projects - Get all projects for the authenticated customer
router.get('/', authenticateToken, (req, res) => {
  console.log('=== GET /api/projects endpoint called ===');
  console.log('Authenticated user:', req.user);
  
  // Only allow customers to see their own projects
  if (req.user.userType !== 'customer') {
    console.log('Access denied: User is not a customer, userType:', req.user.userType);
    return res.status(403).json({ message: 'Access denied. Customer access required.' });
  }

  const customerId = req.user.userId;
  console.log('Fetching projects for customer ID:', customerId);

  // Query to get projects for the specific customer with user name
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.status,
      p.budget,
      p.start_date,
      p.end_date,
      p.customer_id,
      p.created_at,
      u.name as customer_name
    FROM projects p
    LEFT JOIN users u ON p.customer_id = u.id
    WHERE p.customer_id = ?
    ORDER BY p.created_at DESC
  `;

  db.all(query, [customerId], (err, rows) => {
    if (err) {
      console.error('Database error when fetching projects:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log('Database query completed. Found projects:', rows.length);
    console.log('Projects data:', rows);

    res.json(rows);
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

  const { name, description, budget, start_date, end_date } = req.body;
  const customer_id = req.user.userId;

  // Validate required fields
  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  console.log('Creating project for customer ID:', customer_id);

  const query = `
    INSERT INTO projects (name, description, status, budget, start_date, end_date, customer_id)
    VALUES (?, ?, 'Planning', ?, ?, ?, ?)
  `;

  db.run(query, [name, description, budget, start_date, end_date, customer_id], function(err) {
    if (err) {
      console.error('Database error when creating project:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log('Project created successfully with ID:', this.lastID);

    // Fetch the created project with customer name
    const selectQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.budget,
        p.start_date,
        p.end_date,
        p.customer_id,
        p.created_at,
        u.name as customer_name
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
  const { name, description, status, budget, start_date, end_date } = req.body;
  
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
      SET name = ?, description = ?, status = ?, budget = ?, start_date = ?, end_date = ?
      WHERE id = ? AND customer_id = ?
    `;

    db.run(updateQuery, [name, description, status, budget, start_date, end_date, projectId, req.user.userId], function(err) {
      if (err) {
        console.error('Database error when updating project:', err.message);
        return res.status(500).json({ error: err.message });
      }

      // Fetch the updated project with customer name
      const selectQuery = `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.status,
          p.budget,
          p.start_date,
          p.end_date,
          p.customer_id,
          p.created_at,
          u.name as customer_name
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

module.exports = router;