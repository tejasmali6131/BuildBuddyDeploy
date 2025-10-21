const express = require('express');
const path = require('path');
const Portfolio = require('../models/Portfolio');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Get all portfolio items for the authenticated architect
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'architect') {
      return res.status(403).json({ error: 'Only architects can access portfolio' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Portfolio.getPaginated(req.user.id, page, limit);
    
    res.json({
      success: true,
      data: result.portfolios,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
});

// Get portfolio items for a specific architect (public access for customers)
router.get('/architect/:architectId', authenticateToken, async (req, res) => {
  try {
    const architectId = req.params.architectId;
    console.log('Fetching portfolio for architect ID:', architectId);

    const portfolios = await Portfolio.getByArchitectId(architectId);
    
    // Transform the data to match the expected format for the frontend
    const formattedPortfolios = portfolios.map(item => {
      let imageUrls = [];
      try {
        imageUrls = item.image_urls ? JSON.parse(item.image_urls) : [];
      } catch (e) {
        console.warn('Failed to parse image_urls for portfolio item', item.id, ':', e.message);
        imageUrls = [];
      }
      
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.pdf_filename ? 'pdf' : 'link',
        file_url: item.pdf_path,
        url: item.portfolio_url,
        created_at: item.created_at,
        project_type: item.project_type,
        completion_date: item.completion_date,
        client_name: item.client_name,
        image_urls: imageUrls
      };
    });
    
    console.log(`Found ${formattedPortfolios.length} portfolio items for architect ${architectId}`);
    
    res.json({
      success: true,
      portfolio: formattedPortfolios
    });
  } catch (error) {
    console.error('Error fetching architect portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
});

// Get a specific portfolio item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.getById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    // Check if the portfolio belongs to the authenticated architect or allow public view
    if (req.user.user_type === 'architect' && portfolio.architect_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
});

// Create a new portfolio item
router.post('/', authenticateToken, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), async (req, res) => {
  try {
    if (req.user.user_type !== 'architect') {
      return res.status(403).json({ error: 'Only architects can create portfolio items' });
    }

    const {
      title,
      description,
      project_type,
      completion_date,
      client_name,
      portfolio_url
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    let pdf_filename = null;
    let pdf_path = null;
    let image_urls = [];

    // Handle PDF upload
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      const pdfFile = req.files.pdf[0];
      pdf_filename = pdfFile.filename;
      // Use the full Cloudinary URL instead of relative path
      pdf_path = pdfFile.path;
      console.log('PDF uploaded to Cloudinary:', pdf_path);
    }

    // Handle image uploads
    if (req.files && req.files.images) {
      // Use full Cloudinary URLs for images too
      image_urls = req.files.images.map(file => file.path);
      console.log('Images uploaded to Cloudinary:', image_urls);
    }

    const portfolioData = {
      architect_id: req.user.id,
      title,
      description,
      project_type,
      completion_date,
      client_name,
      portfolio_url,
      pdf_filename,
      pdf_path,
      image_urls
    };

    const portfolio = await Portfolio.create(portfolioData);
    
    res.status(201).json({
      success: true,
      message: 'Portfolio item created successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

// Update a portfolio item
router.put('/:id', authenticateToken, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), async (req, res) => {
  try {
    if (req.user.user_type !== 'architect') {
      return res.status(403).json({ error: 'Only architects can update portfolio items' });
    }

    const portfolio = await Portfolio.getById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (portfolio.architect_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own portfolio items' });
    }

    const {
      title,
      description,
      project_type,
      completion_date,
      client_name,
      portfolio_url
    } = req.body;

    let pdf_filename = portfolio.pdf_filename;
    let pdf_path = portfolio.pdf_path;
    let image_urls = portfolio.image_urls || [];

    // Handle new PDF upload
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      // Delete old PDF from Cloudinary if exists
      if (portfolio.pdf_path && portfolio.pdf_filename) {
        try {
          // Extract public_id from Cloudinary URL for deletion
          const publicId = `buildbuddy/portfolios/${portfolio.pdf_filename}`;
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          console.log('Old PDF deleted from Cloudinary:', publicId);
        } catch (error) {
          console.error('Failed to delete old PDF from Cloudinary:', error);
        }
      }

      const pdfFile = req.files.pdf[0];
      pdf_filename = pdfFile.filename;
      // Use full Cloudinary URL
      pdf_path = pdfFile.path;
      console.log('New PDF uploaded to Cloudinary:', pdf_path);
    }

    // Handle new image uploads
    if (req.files && req.files.images) {
      // Delete old images from Cloudinary if replace_images is true
      if (req.body.replace_images === 'true' && portfolio.image_urls) {
        for (const imageUrl of portfolio.image_urls) {
          try {
            // Extract public_id from Cloudinary URL for deletion
            const imageName = path.basename(imageUrl);
            const publicId = `buildbuddy/portfolios/${imageName}`;
            await cloudinary.uploader.destroy(publicId);
            console.log('Old image deleted from Cloudinary:', publicId);
          } catch (error) {
            console.error('Failed to delete old image from Cloudinary:', error);
          }
        }
        // Use full Cloudinary URLs for new images
        image_urls = req.files.images.map(file => file.path);
      } else {
        // Append new images with full Cloudinary URLs
        const newImageUrls = req.files.images.map(file => file.path);
        image_urls = [...image_urls, ...newImageUrls];
      }
    }

    const updatedData = {
      title: title || portfolio.title,
      description: description || portfolio.description,
      project_type: project_type || portfolio.project_type,
      completion_date: completion_date || portfolio.completion_date,
      client_name: client_name || portfolio.client_name,
      portfolio_url: portfolio_url || portfolio.portfolio_url,
      pdf_filename,
      pdf_path,
      image_urls
    };

    await Portfolio.update(req.params.id, updatedData);
    
    res.json({
      success: true,
      message: 'Portfolio item updated successfully'
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
});

// Delete a portfolio item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'architect') {
      return res.status(403).json({ error: 'Only architects can delete portfolio items' });
    }

    const portfolio = await Portfolio.getById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (portfolio.architect_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own portfolio items' });
    }

    // Delete associated files
    if (portfolio.pdf_path) {
      const pdfPath = path.join(__dirname, '../uploads/portfolios', portfolio.pdf_filename);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    if (portfolio.image_urls && portfolio.image_urls.length > 0) {
      portfolio.image_urls.forEach(imageUrl => {
        const imageName = path.basename(imageUrl);
        const imagePath = path.join(__dirname, '../uploads/portfolios', imageName);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Portfolio.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/portfolios', filename);
  
  console.log('File request:', filename);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    // Set appropriate headers for PDF files
    if (path.extname(filename).toLowerCase() === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    console.log('Sending file:', filePath);
    res.sendFile(filePath);
  } else {
    console.log('File not found:', filePath);
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;