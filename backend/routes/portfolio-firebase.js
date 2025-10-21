const express = require('express');
const path = require('path');
const Portfolio = require('../models/Portfolio');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/firebaseUploadMiddleware');
const { uploadFileToFirebase, deleteFileFromFirebase } = require('../config/firebase');

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

// Create a new portfolio item with Firebase Storage
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
    let pdf_path = null;
    let image_urls = [];

    try {
      // Handle PDF upload to Firebase
      if (req.files && req.files.pdf && req.files.pdf[0]) {
        const pdfFile = req.files.pdf[0];
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `pdf-${uniqueSuffix}.pdf`;
        
        const uploadResult = await uploadFileToFirebase(pdfFile, 'portfolios/pdfs', filename);
        pdf_url = uploadResult.url;
        pdf_path = uploadResult.path;
      }

      // Handle image uploads to Firebase
      if (req.files && req.files.images) {
        const imageUploadPromises = req.files.images.map(async (imageFile, index) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const extension = path.extname(imageFile.originalname);
          const filename = `image-${uniqueSuffix}${extension}`;
          
          const uploadResult = await uploadFileToFirebase(imageFile, 'portfolios/images', filename);
          return uploadResult.url;
        });

        image_urls = await Promise.all(imageUploadPromises);
      }

      const portfolioData = {
        architect_id: req.user.id,
        title,
        description,
        project_type,
        completion_date,
        client_name,
        portfolio_url,
        pdf_filename: pdf_path ? path.basename(pdf_path) : null,
        pdf_path: pdf_url,
        image_urls
      };

      const portfolio = await Portfolio.create(portfolioData);
      
      res.status(201).json({
        success: true,
        message: 'Portfolio item created successfully',
        data: portfolio
      });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

// Update a portfolio item with Firebase Storage
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
    let pdf_path = portfolio.pdf_filename;
    let image_urls = portfolio.image_urls || [];

    try {
      // Handle new PDF upload
      if (req.files && req.files.pdf && req.files.pdf[0]) {
        // Delete old PDF from Firebase if exists
        if (portfolio.pdf_filename) {
          try {
            await deleteFileFromFirebase(`portfolios/pdfs/${portfolio.pdf_filename}`);
          } catch (deleteError) {
            console.error('Error deleting old PDF:', deleteError);
          }
        }

        const pdfFile = req.files.pdf[0];
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `pdf-${uniqueSuffix}.pdf`;
        
        const uploadResult = await uploadFileToFirebase(pdfFile, 'portfolios/pdfs', filename);
        pdf_url = uploadResult.url;
        pdf_path = uploadResult.path;
      }

      // Handle new image uploads
      if (req.files && req.files.images) {
        // Delete old images if replace_images is true
        if (req.body.replace_images === 'true' && portfolio.image_urls) {
          const deletePromises = portfolio.image_urls.map(async (imageUrl) => {
            try {
              // Extract filename from URL for deletion
              const urlParts = imageUrl.split('/');
              const filename = urlParts[urlParts.length - 1].split('?')[0];
              await deleteFileFromFirebase(`portfolios/images/${filename}`);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          });
          await Promise.all(deletePromises);

          // Upload new images
          const imageUploadPromises = req.files.images.map(async (imageFile, index) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(imageFile.originalname);
            const filename = `image-${uniqueSuffix}${extension}`;
            
            const uploadResult = await uploadFileToFirebase(imageFile, 'portfolios/images', filename);
            return uploadResult.url;
          });

          image_urls = await Promise.all(imageUploadPromises);
        } else {
          // Append new images
          const imageUploadPromises = req.files.images.map(async (imageFile, index) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(imageFile.originalname);
            const filename = `image-${uniqueSuffix}${extension}`;
            
            const uploadResult = await uploadFileToFirebase(imageFile, 'portfolios/images', filename);
            return uploadResult.url;
          });

          const newImageUrls = await Promise.all(imageUploadPromises);
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
        pdf_filename: pdf_path ? path.basename(pdf_path) : portfolio.pdf_filename,
        pdf_path: pdf_url,
        image_urls
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
      // Delete associated files from Firebase
      if (portfolio.pdf_filename) {
        await deleteFileFromFirebase(`portfolios/pdfs/${portfolio.pdf_filename}`);
      }

      if (portfolio.image_urls && portfolio.image_urls.length > 0) {
        const deletePromises = portfolio.image_urls.map(async (imageUrl) => {
          try {
            // Extract filename from URL for deletion
            const urlParts = imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0];
            await deleteFileFromFirebase(`portfolios/images/${filename}`);
          } catch (deleteError) {
            console.error('Error deleting image:', deleteError);
          }
        });
        await Promise.all(deletePromises);
      }
    } catch (deleteError) {
      console.error('Error deleting files from Firebase:', deleteError);
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