const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, '..', 'buildbuddy.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'architect')),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          phone TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        } else {
          console.log('✅ Users table ready');
          resolve();
        }
      });
    });

    // Create customer_profiles table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          project_type TEXT,
          project_description TEXT,
          budget_range TEXT,
          preferred_style TEXT,
          timeline TEXT,
          location TEXT,
          special_requirements TEXT,
          profile_completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating customer_profiles table:', err);
          reject(err);
        } else {
          console.log('✅ Customer profiles table ready');
          resolve();
        }
      });
    });

    // Create architect_profiles table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS architect_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          company_name TEXT,
          license_number TEXT,
          years_experience INTEGER,
          specialization TEXT,
          portfolio_url TEXT,
          bio TEXT,
          hourly_rate DECIMAL(10,2),
          availability_status TEXT DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating architect_profiles table:', err);
          reject(err);
        } else {
          console.log('✅ Architect profiles table ready');
          resolve();
        }
      });
    });

    // Create password_reset_tokens table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating password_reset_tokens table:', err);
          reject(err);
        } else {
          console.log('✅ Password reset tokens table ready');
          resolve();
        }
      });
    });

    // Create projects table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          customer_email TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          project_type TEXT DEFAULT 'General',
          location TEXT DEFAULT 'Not specified',
          area_sqft INTEGER DEFAULT 0,
          budget_min INTEGER DEFAULT 0,
          budget_max INTEGER DEFAULT 0,
          timeline TEXT,
          requirements TEXT,
          attachments TEXT, -- JSON array of file URLs
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating projects table:', err);
          reject(err);
        } else {
          console.log('✅ Projects table ready');
          resolve();
        }
      });
    });

    // Create project_bids table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS project_bids (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          architect_id INTEGER NOT NULL,
          bid_amount INTEGER NOT NULL,
          estimated_duration TEXT NOT NULL,
          proposal_description TEXT NOT NULL,
          experience_note TEXT,
          portfolio_samples TEXT, -- JSON array of portfolio URLs
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (architect_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(project_id, architect_id) -- One bid per architect per project
        )
      `, (err) => {
        if (err) {
          console.error('Error creating project_bids table:', err);
          reject(err);
        } else {
          console.log('✅ Project bids table ready');
          resolve();
        }
      });
    });

    // Create project_communications table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS project_communications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
          attachment_url TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating project_communications table:', err);
          reject(err);
        } else {
          console.log('✅ Project communications table ready');
          resolve();
        }
      });
    });

    // Create project_milestones table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS project_milestones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          due_date DATE,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
          completion_date DATETIME,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating project_milestones table:', err);
          reject(err);
        } else {
          console.log('✅ Project milestones table ready');
          resolve();
        }
      });
    });

    // Create notifications table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('project_bid', 'bid_accepted', 'bid_rejected', 'project_update', 'milestone', 'message')),
          related_id INTEGER, -- Can reference project_id, bid_id, etc.
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating notifications table:', err);
          reject(err);
        } else {
          console.log('✅ Notifications table ready');
          resolve();
        }
      });
    });

    // Create portfolios table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          architect_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          project_type TEXT,
          completion_date DATE,
          client_name TEXT,
          portfolio_url TEXT,
          pdf_filename TEXT,
          pdf_path TEXT,
          image_urls TEXT, -- JSON string of image URLs
          is_featured BOOLEAN DEFAULT FALSE,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (architect_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating portfolios table:', err);
          reject(err);
        } else {
          console.log('✅ Portfolios table ready');
          resolve();
        }
      });
    });

    // Create ratings table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          architect_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
          review_text TEXT,
          communication_rating INTEGER CHECK(communication_rating >= 1 AND communication_rating <= 5),
          design_quality_rating INTEGER CHECK(design_quality_rating >= 1 AND design_quality_rating <= 5),
          timeliness_rating INTEGER CHECK(timeliness_rating >= 1 AND timeliness_rating <= 5),
          value_rating INTEGER CHECK(value_rating >= 1 AND value_rating <= 5),
          would_recommend BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES bids(id) ON DELETE CASCADE,
          FOREIGN KEY (architect_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(project_id, customer_id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating ratings table:', err);
          reject(err);
        } else {
          console.log('✅ Ratings table ready');
          resolve();
        }
      });
    });

    // Create project completion table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS project_completion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          architect_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'cancelled')),
          completion_date DATE,
          completion_notes TEXT,
          rating_requested BOOLEAN DEFAULT 0,
          rating_submitted BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES bids(id) ON DELETE CASCADE,
          FOREIGN KEY (architect_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(project_id, architect_id, customer_id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating project_completion table:', err);
          reject(err);
        } else {
          console.log('✅ Project completion table ready');
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Database query helper functions
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Database run error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database get error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Transaction helpers
const beginTransaction = () => {
  return run('BEGIN TRANSACTION');
};

const commitTransaction = () => {
  return run('COMMIT');
};

const rollbackTransaction = () => {
  return run('ROLLBACK');
};

module.exports = {
  db,
  initializeDatabase,
  query,
  run,
  get,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};