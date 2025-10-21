const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType,
      // Architect specific data
      company,
      license,
      experience,
      specialization,
      portfolio
    } = userData;

    return await transaction(async (client) => {
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user into users table
      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, user_type) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, first_name, last_name, email, phone, user_type, created_at`,
        [firstName, lastName, email.toLowerCase(), passwordHash, phone, userType]
      );

      const user = userResult.rows[0];

      // If architect, create architect profile
      if (userType === 'architect') {
        await client.query(
          `INSERT INTO architect_profiles (user_id, company_name, license_number, years_experience, specialization, portfolio_url) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, company, license, experience, specialization, portfolio]
        );
      }

      return user;
    });
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0];
  }

  // Find user by ID with profile data
  static async findById(id) {
    const userResult = await query(
      'SELECT id, first_name, last_name, email, phone, user_type, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // If architect, get architect profile data
    if (user.user_type === 'architect') {
      const architectResult = await query(
        'SELECT company_name, license_number, years_experience, specialization, portfolio_url FROM architect_profiles WHERE user_id = $1',
        [id]
      );

      if (architectResult.rows.length > 0) {
        user.architectData = architectResult.rows[0];
      }
    }

    return user;
  }

  // Update user profile
  static async updateProfile(id, updateData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      // Architect specific updates
      company,
      license,
      experience,
      specialization,
      portfolio
    } = updateData;

    return await transaction(async (client) => {
      // Update basic user info
      const userResult = await client.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 
         RETURNING id, first_name, last_name, email, phone, user_type, updated_at`,
        [firstName, lastName, email.toLowerCase(), phone, id]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // If architect, update architect profile
      if (user.user_type === 'architect' && (company || license || experience || specialization || portfolio)) {
        await client.query(
          `UPDATE architect_profiles 
           SET company_name = COALESCE($1, company_name),
               license_number = COALESCE($2, license_number),
               years_experience = COALESCE($3, years_experience),
               specialization = COALESCE($4, specialization),
               portfolio_url = COALESCE($5, portfolio_url),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $6`,
          [company, license, experience, specialization, portfolio, id]
        );
      }

      return user;
    });
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Check if email exists
  static async emailExists(email) {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  // Get user statistics
  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN user_type = 'architect' THEN 1 ELSE 0 END) as architects,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_last_30_days
      FROM users
    `);
    return result.rows[0];
  }
}

module.exports = User;