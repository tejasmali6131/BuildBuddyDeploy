const express = require('express');
const Portfolio = require('../models/Portfolio');
const authenticateToken = require('../middleware/auth');
const { upload, deleteCloudinaryFile } = require('../config/cloudinary');

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
router.get('/architect/:architectId', async (req, res) => {
  try {
    const { architectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Portfolio.getPaginated(architectId, page, limit);
    
    res.json({
      success: true,
      data: result.portfolios,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching architect portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch architect portfolio items' });
  }
});

// Get a specific portfolio item
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.getById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    res.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
});

// Create a new portfolio item with Cloudinary Storage
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

    let pdf_url = null;
    let pdf_public_id = null;
    let image_urls = [];

    // Handle PDF upload
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      const pdfFile = req.files.pdf[0];
      pdf_url = pdfFile.path; // Cloudinary URL
      pdf_public_id = pdfFile.filename; // Cloudinary public_id
    }

    // Handle image uploads
    if (req.files && req.files.images) {
      image_urls = req.files.images.map(file => ({
        url: file.path,
        public_id: file.filename
      }));
    }

    const portfolioData = {
      architect_id: req.user.id,
      title,
      description,
      project_type,
      completion_date,
      client_name,
      portfolio_url,
      pdf_filename: pdf_public_id,
      pdf_path: pdf_url,
      image_urls: JSON.stringify(image_urls) // Store as JSON string
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

    let pdf_url = portfolio.pdf_path;
    let pdf_public_id = portfolio.pdf_filename;
    let image_urls = portfolio.image_urls ? JSON.parse(portfolio.image_urls) : [];

    try {
      // Handle new PDF upload
      if (req.files && req.files.pdf && req.files.pdf[0]) {
        // Delete old PDF from Cloudinary
        if (portfolio.pdf_filename) {
          try {
            await deleteCloudinaryFile(portfolio.pdf_filename, 'raw'); // PDFs are 'raw' type
          } catch (deleteError) {
            console.error('Error deleting old PDF:', deleteError);
          }
        }

        const pdfFile = req.files.pdf[0];
        pdf_url = pdfFile.path;
        pdf_public_id = pdfFile.filename;
      }

      // Handle new image uploads
      if (req.files && req.files.images) {
        if (req.body.replace_images === 'true' && image_urls.length > 0) {
          // Delete old images
          const deletePromises = image_urls.map(async (img) => {
            try {
              await deleteCloudinaryFile(img.public_id, 'image');
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          });
          await Promise.all(deletePromises);

          // Set new images
          image_urls = req.files.images.map(file => ({
            url: file.path,
            public_id: file.filename
          }));
        } else {
          // Append new images
          const newImages = req.files.images.map(file => ({
            url: file.path,
            public_id: file.filename
          }));
          image_urls = [...image_urls, ...newImages];
        }
      }

      const updatedData = {
        title: title || portfolio.title,
        description: description || portfolio.description,
        project_type: project_type || portfolio.project_type,
        completion_date: completion_date || portfolio.completion_date,
        client_name: client_name || portfolio.client_name,
        portfolio_url: portfolio_url || portfolio.portfolio_url,
        pdf_filename: pdf_public_id,
        pdf_path: pdf_url,
        image_urls: JSON.stringify(image_urls)
      };

      await Portfolio.update(req.params.id, updatedData);
      
      res.json({
        success: true,
        message: 'Portfolio item updated successfully'
      });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      res.status(500).json({ error: 'Failed to upload files' });
    }
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

    try {
      // Delete PDF from Cloudinary
      if (portfolio.pdf_filename) {
        await deleteCloudinaryFile(portfolio.pdf_filename, 'raw');
      }

      // Delete images from Cloudinary
      if (portfolio.image_urls) {
        const imageUrls = JSON.parse(portfolio.image_urls);
        const deletePromises = imageUrls.map(async (img) => {
          try {
            await deleteCloudinaryFile(img.public_id, 'image');
          } catch (deleteError) {
            console.error('Error deleting image:', deleteError);
          }
        });
        await Promise.all(deletePromises);
      }
    } catch (deleteError) {
      console.error('Error deleting files from Cloudinary:', deleteError);
      // Continue with database deletion even if file deletion fails
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

module.exports = router;