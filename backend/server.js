const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database and initialize
const { initializeDatabase } = require('./config/database-sqlite');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const bidRoutes = require('./routes/bids');
const notificationRoutes = require('./routes/notifications');
const portfolioRoutes = require('./routes/portfolio-firebase'); // Updated to use Firebase version

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (only if build directory exists)
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log('📦 Serving static files from frontend build');
} else {
  console.log('⚠️  Frontend build not found. Run "npm run build" in frontend directory');
}

// Serve uploaded files statically
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serving uploaded files from:', uploadsPath);

// Serve portfolio uploads specifically with proper headers
const portfolioUploadsPath = path.join(__dirname, 'uploads/portfolios');
app.use('/api/portfolio/uploads', express.static(portfolioUploadsPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
console.log('📁 Serving portfolio uploads from:', portfolioUploadsPath);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BuildBuddy API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database status
app.get('/api/debug/database', async (req, res) => {
  const { db } = require('./config/database-sqlite');
  
  try {
    // Check tables
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Check projects count
    const projectCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM projects", (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    });
    
    // Get sample projects
    const sampleProjects = await new Promise((resolve, reject) => {
      db.all("SELECT id, title, status, customer_email FROM projects LIMIT 3", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    res.json({
      status: 'OK',
      tables: tables.map(t => t.name),
      projectCount,
      sampleProjects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to create test projects
app.post('/api/debug/create-test-projects', async (req, res) => {
  const { db } = require('./config/database-sqlite');
  
  try {
    const testProjects = [
      {
        title: 'Modern Villa Design',
        description: 'Need architect for modern 3-bedroom villa with pool',
        project_type: 'Residential',
        location: 'Mumbai',
        area_sqft: 2500,
        budget_min: 500000,
        budget_max: 750000,
        timeline: '6 months',
        requirements: 'Modern design with sustainable materials',
        priority: 'high',
        status: 'open',
        customer_id: 1,
        customer_email: 'tejas@gmail.com'
      },
      {
        title: 'Office Complex Renovation',
        description: 'Renovate existing office building for tech company',
        project_type: 'Commercial',
        location: 'Pune',
        area_sqft: 5000,
        budget_min: 800000,
        budget_max: 1200000,
        timeline: '4 months',
        requirements: 'Open floor plan, meeting rooms, cafeteria',
        priority: 'medium',
        status: 'open',
        customer_id: 1,
        customer_email: 'tejas@gmail.com'
      }
    ];
    
    const insertPromises = testProjects.map(project => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO projects (title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority, status, customer_id, customer_email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
          project.title,
          project.description,
          project.project_type,
          project.location,
          project.area_sqft,
          project.budget_min,
          project.budget_max,
          project.timeline,
          project.requirements,
          project.priority,
          project.status,
          project.customer_id,
          project.customer_email
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });
    
    const createdIds = await Promise.all(insertPromises);
    
    res.json({
      status: 'OK',
      message: 'Test projects created',
      createdProjects: createdIds,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for architect projects (without authentication for debugging)
app.get('/api/debug/architect-projects', async (req, res) => {
  const { db } = require('./config/database-sqlite');
  
  try {
    const query = `
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
      ORDER BY p.created_at DESC
    `;
    
    const projects = await new Promise((resolve, reject) => {
      db.all(query, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    res.json({
      status: 'OK',
      message: 'Architect projects query test',
      projects: projects,
      count: projects.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Bid routes
app.use('/api/bids', bidRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Portfolio routes
app.use('/api/portfolio', portfolioRoutes);

// Ratings routes
const ratingsRoutes = require('./routes/ratings');
app.use('/api/ratings', ratingsRoutes);

// Architects routes
const architectsRoutes = require('./routes/architects');
app.use('/api/architects', architectsRoutes);

// Test file serving endpoint
app.get('/api/test-file-serving', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads/portfolios');
  const fs = require('fs');
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      uploadsDir,
      exists: true,
      files: files.slice(0, 10) // Show first 10 files
    });
  } else {
    res.json({
      uploadsDir,
      exists: false,
      files: []
    });
  }
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message, userType } = req.body;
  
  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, and message are required'
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  // Log the contact form submission (in production, you'd save to database)
  console.log('New contact form submission:', {
    name,
    email,
    userType: userType || 'customer',
    message: message.substring(0, 100) + '...', // Log only first 100 chars
    timestamp: new Date().toISOString()
  });
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      reference: `BB-${Date.now()}`
    });
  }, 1000);
});

// Get architects endpoint (mock data)
app.get('/api/architects', (req, res) => {
  const { specialization, location, rating } = req.query;
  
  const mockArchitects = [
    {
      id: 1,
      name: 'Arjun Sharma',
      specialization: 'Residential Design',
      location: 'Mumbai, Maharashtra',
      rating: 4.9,
      experience: 15,
      projects: 200,
      hourlyRate: 12000,
      avatar: 'AS',
      verified: true
    },
    {
      id: 2,
      name: 'Priya Patel',
      specialization: 'Commercial Spaces',
      location: 'Delhi, NCR',
      rating: 4.8,
      experience: 12,
      projects: 150,
      hourlyRate: 15000,
      avatar: 'PP',
      verified: true
    },
    {
      id: 3,
      name: 'Vikram Singh',
      specialization: 'Interior Design',
      location: 'Bangalore, Karnataka',
      rating: 4.7,
      experience: 10,
      projects: 120,
      hourlyRate: 11000,
      avatar: 'VS',
      verified: true
    }
  ];
  
  let filteredArchitects = mockArchitects;
  
  if (specialization) {
    filteredArchitects = filteredArchitects.filter(architect => 
      architect.specialization.toLowerCase().includes(specialization.toLowerCase())
    );
  }
  
  if (location) {
    filteredArchitects = filteredArchitects.filter(architect => 
      architect.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  if (rating) {
    filteredArchitects = filteredArchitects.filter(architect => 
      architect.rating >= parseFloat(rating)
    );
  }
  
  res.json({
    architects: filteredArchitects,
    total: filteredArchitects.length,
    filters: { specialization, location, rating }
  });
});

// Project submission endpoint
app.post('/api/projects', (req, res) => {
  const { title, description, budget, timeline, location, projectType } = req.body;
  
  if (!title || !description || !budget || !location) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, budget, and location are required'
    });
  }
  
  // Log the project submission
  console.log('New project submission:', {
    title,
    projectType: projectType || 'residential',
    budget,
    location,
    timestamp: new Date().toISOString()
  });
  
  // Generate mock project ID
  const projectId = `PROJ-${Date.now()}`;
  
  res.json({
    success: true,
    message: 'Project submitted successfully! We are matching you with qualified architects.',
    projectId,
    estimatedMatches: Math.floor(Math.random() * 5) + 3, // 3-7 matches
    expectedResponseTime: '24 hours'
  });
});

// Newsletter subscription
app.post('/api/newsletter', (req, res) => {
  const { email, userType } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  console.log('Newsletter subscription:', {
    email,
    userType: userType || 'customer',
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Successfully subscribed to BuildBuddy newsletter!'
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    totalProjects: 8547,
    totalArchitects: 1834,
    avgRating: 4.8,
    totalUsers: 35419,
    projectsThisMonth: 847,
    newArchitectsThisMonth: 67
  });
});

// Features endpoint
app.get('/api/features', (req, res) => {
  const features = [
    {
      icon: 'fas fa-zap',
      title: 'Instant Matching',
      description: 'Get connected with qualified architects in under 24 hours based on your project needs.'
    },
    {
      icon: 'fas fa-shield-check',
      title: 'Verified Experts',
      description: 'All architects are professionally verified with credentials and portfolio reviews.'
    },
    {
      icon: 'fas fa-comments',
      title: 'Easy Communication',
      description: 'Built-in messaging and collaboration tools to keep your project on track.'
    },
    {
      icon: 'fas fa-lock',
      title: 'Secure Process',
      description: 'Protected payments and clear contracts ensure peace of mind for everyone.'
    }
  ];
  
  res.json(features);
});

// Testimonials endpoint
app.get('/api/testimonials', (req, res) => {
  // Return empty array - no fake testimonials
  // In production, this would fetch from a real database
  const testimonials = [];
  
  res.json(testimonials);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Serve React app for all non-API routes (only if build exists)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend not built',
      message: 'Please build the frontend first with: npm run build',
      api: 'API endpoints are available at /api/*'
    });
  }
});

// Start server with database initialization
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('🗄️  Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 BuildBuddy server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔧 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();