const db = require('../config/database-sqlite').db;

class Portfolio {
  // Create a new portfolio item
  static async create(portfolioData) {
    const { 
      architect_id, 
      title, 
      description, 
      project_type, 
      completion_date, 
      client_name, 
      portfolio_url,
      pdf_filename,
      pdf_path,
      image_urls 
    } = portfolioData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO portfolios (
          architect_id, title, description, project_type, 
          completion_date, client_name, portfolio_url, 
          pdf_filename, pdf_path, image_urls,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const values = [
        architect_id, title, description, project_type,
        completion_date, client_name, portfolio_url,
        pdf_filename, pdf_path, JSON.stringify(image_urls || [])
      ];

      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error creating portfolio:', err);
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            architect_id,
            title,
            description,
            project_type,
            completion_date,
            client_name,
            portfolio_url,
            pdf_filename,
            pdf_path,
            image_urls
          });
        }
      });
    });
  }

  // Get all portfolio items for an architect
  static async getByArchitectId(architect_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM portfolios 
        WHERE architect_id = ? 
        ORDER BY created_at DESC
      `;

      db.all(sql, [architect_id], (err, rows) => {
        if (err) {
          console.error('Error fetching portfolios:', err);
          reject(err);
        } else {
          const portfolios = rows.map(row => ({
            ...row,
            image_urls: row.image_urls ? JSON.parse(row.image_urls) : []
          }));
          resolve(portfolios);
        }
      });
    });
  }

  // Get a specific portfolio item by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM portfolios WHERE id = ?`;

      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error fetching portfolio:', err);
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            image_urls: row.image_urls ? JSON.parse(row.image_urls) : []
          });
        }
      });
    });
  }

  // Update a portfolio item
  static async update(id, portfolioData) {
    const { 
      title, 
      description, 
      project_type, 
      completion_date, 
      client_name, 
      portfolio_url,
      pdf_filename,
      pdf_path,
      image_urls 
    } = portfolioData;

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE portfolios SET 
          title = ?, description = ?, project_type = ?, 
          completion_date = ?, client_name = ?, portfolio_url = ?,
          pdf_filename = ?, pdf_path = ?, image_urls = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const values = [
        title, description, project_type, completion_date, 
        client_name, portfolio_url, pdf_filename, pdf_path,
        JSON.stringify(image_urls || []), id
      ];

      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error updating portfolio:', err);
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Delete a portfolio item
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM portfolios WHERE id = ?`;

      db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting portfolio:', err);
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Get portfolio items with pagination
  static async getPaginated(architect_id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    return new Promise((resolve, reject) => {
      // Get total count
      db.get(
        'SELECT COUNT(*) as total FROM portfolios WHERE architect_id = ?',
        [architect_id],
        (err, countResult) => {
          if (err) {
            reject(err);
            return;
          }

          const total = countResult.total;
          
          // Get paginated results
          const sql = `
            SELECT * FROM portfolios 
            WHERE architect_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
          `;

          db.all(sql, [architect_id, limit, offset], (err, rows) => {
            if (err) {
              console.error('Error fetching paginated portfolios:', err);
              reject(err);
            } else {
              const portfolios = rows.map(row => ({
                ...row,
                image_urls: row.image_urls ? JSON.parse(row.image_urls) : []
              }));
              
              resolve({
                portfolios,
                pagination: {
                  currentPage: page,
                  totalPages: Math.ceil(total / limit),
                  totalItems: total,
                  itemsPerPage: limit
                }
              });
            }
          });
        }
      );
    });
  }
}

module.exports = Portfolio;