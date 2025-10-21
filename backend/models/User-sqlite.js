const bcrypt = require('bcryptjs');
const { run, get, query } = require('../config/database-sqlite');

class User {
  // Create a new user
  static async create(userData) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        userType,
        // Architect specific fields
        company,
        license,
        experience,
        specialization,
        portfolio
      } = userData;

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user into database
      const result = await run(`
        INSERT INTO users (user_type, first_name, last_name, email, password_hash, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userType, firstName, lastName, email.toLowerCase(), passwordHash, phone]);

      const userId = result.id;

      // Create profile based on user type
      if (userType === 'architect') {
        await run(`
          INSERT INTO architect_profiles (user_id, company_name, license_number, years_experience, specialization, portfolio_url)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, company, license, experience, specialization, portfolio || null]);
      } else if (userType === 'customer') {
        await run(`
          INSERT INTO customer_profiles (user_id)
          VALUES (?)
        `, [userId]);
      }

      // Return created user
      return await this.findById(userId);

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const user = await get(`
        SELECT * FROM users WHERE email = ? LIMIT 1
      `, [email.toLowerCase()]);

      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID with profile data
  static async findById(userId) {
    try {
      const user = await get(`
        SELECT * FROM users WHERE id = ? LIMIT 1
      `, [userId]);

      if (!user) {
        return null;
      }

      // Get profile data based on user type
      let profileData = null;
      if (user.user_type === 'architect') {
        profileData = await get(`
          SELECT * FROM architect_profiles WHERE user_id = ? LIMIT 1
        `, [userId]);
      } else if (user.user_type === 'customer') {
        profileData = await get(`
          SELECT * FROM customer_profiles WHERE user_id = ? LIMIT 1
        `, [userId]);
      }

      // Attach profile data to user object
      if (profileData) {
        user.architectData = user.user_type === 'architect' ? profileData : null;
        user.customerData = user.user_type === 'customer' ? profileData : null;
      }

      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email) {
    try {
      const user = await get(`
        SELECT id FROM users WHERE email = ? LIMIT 1
      `, [email.toLowerCase()]);

      return !!user;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
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
      } = updateData;

      // Update main user data
      await run(`
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [firstName, lastName, email.toLowerCase(), phone, userId]);

      // Update architect profile if architect fields provided
      if (company || license || experience || specialization || portfolio) {
        await run(`
          UPDATE architect_profiles 
          SET company_name = ?, license_number = ?, years_experience = ?, 
              specialization = ?, portfolio_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [company, license, experience, specialization, portfolio, userId]);
      }

      // Return updated user
      return await this.findById(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      if (error.message && error.message.includes('not found')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  // Get user statistics
  static async getStats() {
    try {
      const totalUsers = await get('SELECT COUNT(*) as count FROM users');
      const totalCustomers = await get('SELECT COUNT(*) as count FROM users WHERE user_type = "customer"');
      const totalArchitects = await get('SELECT COUNT(*) as count FROM users WHERE user_type = "architect"');
      const recentUsers = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= datetime('now', '-30 days')
      `);

      return {
        totalUsers: totalUsers.count,
        totalCustomers: totalCustomers.count,
        totalArchitects: totalArchitects.count,
        recentUsers: recentUsers[0].count
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Get all users (admin function)
  static async getAll(limit = 50, offset = 0) {
    try {
      const users = await query(`
        SELECT id, user_type, first_name, last_name, email, phone, 
               is_verified, is_active, created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Delete user (admin function)
  static async delete(userId) {
    try {
      const result = await run('DELETE FROM users WHERE id = ?', [userId]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Generate password reset token
  static async generateResetToken(email) {
    try {
      // Check if user exists
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate random token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Store token in database
      await run(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `, [user.id, token, expiresAt]);

      return token;
    } catch (error) {
      console.error('Error generating reset token:', error);
      throw error;
    }
  }

  // Verify reset token
  static async verifyResetToken(token) {
    try {
      const tokenData = await get(`
        SELECT prt.*, u.email 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > datetime('now')
        LIMIT 1
      `, [token]);

      return tokenData;
    } catch (error) {
      console.error('Error verifying reset token:', error);
      throw error;
    }
  }

  // Reset password with token
  static async resetPassword(token, newPassword) {
    try {
      // Verify token
      const tokenData = await this.verifyResetToken(token);
      if (!tokenData) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await run(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hashedPassword, tokenData.user_id]);

      // Mark token as used
      await run(`
        UPDATE password_reset_tokens 
        SET used = TRUE 
        WHERE token = ?
      `, [token]);

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Change password (for logged-in users)
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user's current password hash
      const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await run(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hashedPassword, userId]);

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

module.exports = User;