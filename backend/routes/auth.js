const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User-sqlite');
require('dotenv').config();

const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const {
      userType,
      firstName,
      lastName,
      email,
      password,
      phone,
      // Architect fields only (customer project info will be collected later)
      company,
      license,
      experience,
      specialization,
      portfolio
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !userType) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.emailExists(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType
    };

    // Add architect-specific data if user is an architect
    if (userType === 'architect') {
      if (!company || !license || !experience || !specialization) {
        return res.status(400).json({
          error: 'Company, license, experience, and specialization are required for architects'
        });
      }

      userData.company = company;
      userData.license = license;
      userData.experience = experience;
      userData.specialization = specialization;
      userData.portfolio = portfolio || '';
    }

    // Create user in database
    const newUser = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        userType: newUser.user_type 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        userType: newUser.user_type,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Server error during registration'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check user type if provided
    if (userType && user.user_type !== userType) {
      return res.status(401).json({
        error: `Invalid credentials for ${userType} account`
      });
    }

    // Get complete user profile
    const userProfile = await User.findById(user.id);
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        userType: user.user_type 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        email: userProfile.email,
        phone: userProfile.phone,
        userType: userProfile.user_type,
        architectData: userProfile.architectData || null
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error during login'
    });
  }
});

// Get user profile endpoint
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        userType: user.user_type,
        architectData: user.architectData || null,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching profile'
    });
  }
});

// Update user profile endpoint
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      // Architect specific fields
      company,
      license,
      experience,
      specialization,
      portfolio
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      email,
      phone
    };

    // Add architect fields if provided
    if (company || license || experience || specialization || portfolio) {
      updateData.company = company;
      updateData.license = license;
      updateData.experience = experience;
      updateData.specialization = specialization;
      updateData.portfolio = portfolio;
    }

    const updatedUser = await User.updateProfile(req.user.userId, updateData);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: updatedUser.user_type,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.status(500).json({
      error: 'Server error updating profile'
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    try {
      const token = await User.generateResetToken(email);
      
      // In a real application, you would send this token via email
      // For development, we'll return it in the response
      console.log(`Password reset token for ${email}: ${token}`);
      
      res.json({
        message: 'Password reset instructions have been sent to your email',
        // Remove this in production - only for development
        resetToken: token,
        note: 'In production, this token would be sent via email'
      });

    } catch (error) {
      if (error.message === 'User not found') {
        // Don't reveal if email exists or not for security
        res.json({
          message: 'If an account with that email exists, password reset instructions have been sent'
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server error processing forgot password request'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Reset token and new password are required'
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    await User.resetPassword(token, newPassword);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }
    
    res.status(500).json({
      error: 'Server error resetting password'
    });
  }
});

// Change password endpoint (for logged-in users)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long'
      });
    }

    await User.changePassword(req.user.userId, currentPassword, newPassword);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.status(500).json({
      error: 'Server error changing password'
    });
  }
});

// Get user statistics (admin endpoint)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await User.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Server error fetching statistics'
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;