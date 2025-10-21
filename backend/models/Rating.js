const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Rating {
  constructor() {
    this.dbPath = path.join(__dirname, '../buildbuddy.db');
  }

  // Create ratings table
  static createTable(db) {
    const createRatingsTable = `
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
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (architect_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
      )
    `;

    const createProjectCompletionTable = `
      CREATE TABLE IF NOT EXISTS project_completion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        architect_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        completion_status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
        completion_date DATE,
        completion_notes TEXT,
        rating_requested BOOLEAN DEFAULT 0,
        rating_submitted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (architect_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES users(id),
        UNIQUE(project_id, architect_id, customer_id)
      )
    `;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(createRatingsTable, (err) => {
          if (err) {
            console.error('Error creating ratings table:', err);
            reject(err);
          }
        });

        db.run(createProjectCompletionTable, (err) => {
          if (err) {
            console.error('Error creating project_completion table:', err);
            reject(err);
          } else {
            console.log('Ratings and project completion tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  // Create a new rating (or update existing one)
  async createRating(ratingData) {
    const {
      project_id,
      architect_id,
      customer_id,
      rating,
      review_text,
      communication_rating,
      design_quality_rating,
      timeliness_rating,
      value_rating,
      would_recommend
    } = ratingData;

    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      // First check if rating already exists
      const checkQuery = `SELECT id FROM ratings WHERE project_id = ? AND customer_id = ?`;
      
      db.get(checkQuery, [project_id, customer_id], (checkErr, existingRating) => {
        if (checkErr) {
          console.error('Error checking existing rating:', checkErr);
          reject(checkErr);
          db.close();
          return;
        }

        let query;
        let params;

        if (existingRating) {
          // Update existing rating
          query = `
            UPDATE ratings SET
              architect_id = ?, rating = ?, review_text = ?,
              communication_rating = ?, design_quality_rating = ?, timeliness_rating = ?,
              value_rating = ?, would_recommend = ?, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND customer_id = ?
          `;
          params = [
            architect_id, rating, review_text,
            communication_rating, design_quality_rating, timeliness_rating,
            value_rating, would_recommend, project_id, customer_id
          ];
        } else {
          // Insert new rating
          query = `
            INSERT INTO ratings (
              project_id, architect_id, customer_id, rating, review_text,
              communication_rating, design_quality_rating, timeliness_rating,
              value_rating, would_recommend
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          params = [
            project_id, architect_id, customer_id, rating, review_text,
            communication_rating, design_quality_rating, timeliness_rating,
            value_rating, would_recommend
          ];
        }

        db.run(query, params, function(err) {
          if (err) {
            console.error('Error creating/updating rating:', err);
            reject(err);
          } else {
            // Update project completion status
            const updateCompletionQuery = `
              UPDATE project_completion 
              SET rating_submitted = 1, updated_at = CURRENT_TIMESTAMP
              WHERE project_id = ? AND customer_id = ?
            `;
            
            db.run(updateCompletionQuery, [project_id, customer_id], (updateErr) => {
              if (updateErr) {
                console.error('Error updating completion status:', updateErr);
              }
              
              resolve({ id: this.lastID, ...ratingData });
            });
          }
          db.close();
        });
      });
    });
  }

  // Get ratings for an architect
  async getRatingsByArchitect(architectId) {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.*,
          p.title as project_title,
          p.location as project_location,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          pc.completion_date
        FROM ratings r
        LEFT JOIN projects p ON r.project_id = p.id
        LEFT JOIN users u ON r.customer_id = u.id
        LEFT JOIN project_completion pc ON r.project_id = pc.project_id
        WHERE r.architect_id = ?
        ORDER BY r.created_at DESC
      `;

      db.all(query, [architectId], (err, rows) => {
        if (err) {
          console.error('Error fetching ratings:', err);
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Get average ratings for an architect
  async getArchitectRatingSummary(architectId) {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_ratings,
          AVG(rating) as average_rating,
          AVG(communication_rating) as avg_communication,
          AVG(design_quality_rating) as avg_design_quality,
          AVG(timeliness_rating) as avg_timeliness,
          AVG(value_rating) as avg_value,
          SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) as recommendations,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
        FROM ratings 
        WHERE architect_id = ?
      `;

      db.get(query, [architectId], (err, row) => {
        if (err) {
          console.error('Error fetching rating summary:', err);
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    });
  }

  // Mark project as completed
  async markProjectCompleted(projectId, architectId, customerId, completionNotes = '') {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      // First update the project_completion table
      const completionQuery = `
        INSERT OR REPLACE INTO project_completion (
          project_id, architect_id, customer_id, completion_status,
          completion_date, completion_notes, rating_requested
        ) VALUES (?, ?, ?, 'completed', DATE('now'), ?, 1)
      `;

      db.run(completionQuery, [projectId, architectId, customerId, completionNotes], function(err) {
        if (err) {
          console.error('Error marking project as completed:', err);
          reject(err);
          db.close();
          return;
        }

        const completionId = this.lastID;

        // Then update the main projects table status
        const projectQuery = `UPDATE projects SET status = 'completed' WHERE id = ?`;
        
        db.run(projectQuery, [projectId], function(err) {
          if (err) {
            console.error('Error updating project status:', err);
            reject(err);
          } else {
            resolve({ id: completionId, project_updated: this.changes > 0 });
          }
          db.close();
        });
      });
    });
  }

  // Get completed projects awaiting ratings
  async getCompletedProjectsAwaitingRating(customerId) {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          pc.*,
          p.title as project_title,
          p.location as project_location,
          pb.bid_amount,
          u.first_name as architect_first_name,
          u.last_name as architect_last_name,
          ad.company_name as architect_company
        FROM project_completion pc
        LEFT JOIN projects p ON pc.project_id = p.id
        LEFT JOIN project_bids pb ON pc.project_id = pb.project_id AND pc.architect_id = pb.architect_id
        LEFT JOIN users u ON pc.architect_id = u.id
        LEFT JOIN architect_profiles ad ON u.id = ad.user_id
        WHERE pc.customer_id = ? 
          AND pc.completion_status = 'completed'
          AND pc.rating_submitted = 0
        ORDER BY pc.completion_date DESC
      `;

      db.all(query, [customerId], (err, rows) => {
        if (err) {
          console.error('Error fetching completed projects:', err);
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Get completed projects for architect
  async getCompletedProjectsByArchitect(architectId) {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          pc.*,
          p.title as project_title,
          p.location as project_location,
          pb.bid_amount,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          r.rating,
          r.review_text
        FROM project_completion pc
        LEFT JOIN projects p ON pc.project_id = p.id
        LEFT JOIN project_bids pb ON pc.project_id = pb.project_id AND pc.architect_id = pb.architect_id
        LEFT JOIN users u ON pc.customer_id = u.id
        LEFT JOIN ratings r ON pc.project_id = r.project_id AND pc.customer_id = r.customer_id
        WHERE pc.architect_id = ? AND pc.completion_status = 'completed'
        ORDER BY pc.completion_date DESC
      `;

      db.all(query, [architectId], (err, rows) => {
        if (err) {
          console.error('Error fetching completed projects:', err);
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Get ratings summary/statistics for an architect
  async getRatingsSummary(architectId) {
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as totalRatings,
          AVG(rating) as averageRating,
          AVG(communication_rating) as avgCommunication,
          AVG(design_quality_rating) as avgDesignQuality,
          AVG(timeliness_rating) as avgTimeliness,
          AVG(value_rating) as avgValue,
          SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) as recommendations,
          COUNT(DISTINCT customer_id) as uniqueCustomers
        FROM ratings 
        WHERE architect_id = ?
      `;

      db.get(query, [architectId], (err, row) => {
        if (err) {
          console.error('Error fetching ratings summary:', err);
          reject(err);
        } else {
          resolve(row || {});
        }
        db.close();
      });
    });
  }
}

module.exports = Rating;