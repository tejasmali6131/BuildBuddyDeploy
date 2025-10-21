const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DataConsistencyValidator {
  constructor() {
    this.dbPath = path.join(__dirname, 'buildbuddy.db');
  }

  // Validate and fix all consistency issues
  async validateAndFix(autoFix = false) {
    const db = new sqlite3.Database(this.dbPath);
    const issues = [];
    
    console.log('🔍 Running Data Consistency Validation...\n');

    try {
      // Check 1: Project status vs completion status
      const statusMismatch = await this.checkProjectStatusConsistency(db);
      if (statusMismatch.length > 0) {
        issues.push({
          type: 'project_status_mismatch',
          count: statusMismatch.length,
          description: 'Projects with mismatched status and completion_status',
          items: statusMismatch
        });
        
        if (autoFix) {
          await this.fixProjectStatusConsistency(db);
        }
      }

      // Check 2: Rating submitted flags vs actual ratings
      const ratingMismatch = await this.checkRatingFlagConsistency(db);
      if (ratingMismatch.length > 0) {
        issues.push({
          type: 'rating_flag_mismatch',
          count: ratingMismatch.length,
          description: 'Completion records with incorrect rating_submitted flags',
          items: ratingMismatch
        });
        
        if (autoFix) {
          await this.fixRatingFlagConsistency(db);
        }
      }

      // Check 3: Status progression logic
      const progressionIssues = await this.checkStatusProgression(db);
      if (progressionIssues.length > 0) {
        issues.push({
          type: 'status_progression_issues',
          count: progressionIssues.length,
          description: 'Projects with incorrect status progression',
          items: progressionIssues
        });
        
        if (autoFix) {
          await this.fixStatusProgression(db);
        }
      }

      console.log(autoFix ? '✅ Validation and fixes completed!' : '📊 Validation completed!');
      console.log(`Found ${issues.length} type(s) of issues`);
      
      return issues;
      
    } finally {
      db.close();
    }
  }

  async checkProjectStatusConsistency(db) {
    return new Promise((resolve) => {
      db.all(`
        SELECT p.id, p.title, p.status, pc.completion_status
        FROM projects p
        JOIN project_completion pc ON p.id = pc.project_id
        WHERE (p.status != 'completed' AND pc.completion_status = 'completed')
           OR (p.status = 'completed' AND pc.completion_status != 'completed')
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
  }

  async checkRatingFlagConsistency(db) {
    return new Promise((resolve) => {
      db.all(`
        SELECT pc.id, pc.project_id, pc.rating_submitted, r.id as rating_id
        FROM project_completion pc
        LEFT JOIN ratings r ON pc.project_id = r.project_id AND pc.customer_id = r.customer_id
        WHERE (pc.rating_submitted = 1 AND r.id IS NULL)
           OR (pc.rating_submitted = 0 AND r.id IS NOT NULL)
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
  }

  async checkStatusProgression(db) {
    return new Promise((resolve) => {
      db.all(`
        SELECT p.id, p.title, p.status
        FROM projects p
        WHERE (p.status = 'open' AND p.id IN (
          SELECT project_id FROM project_bids WHERE status = 'accepted'
        )) OR (p.status = 'in_progress' AND p.id IN (
          SELECT project_id FROM project_completion WHERE completion_status = 'completed'
        ))
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
  }

  async fixProjectStatusConsistency(db) {
    return new Promise((resolve) => {
      db.run(`
        UPDATE projects 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT pc.project_id 
          FROM project_completion pc 
          WHERE pc.completion_status = 'completed'
        ) AND status != 'completed'
      `, function(err) {
        if (!err) {
          console.log(`✅ Fixed project status for ${this.changes} project(s)`);
        }
        resolve();
      });
    });
  }

  async fixRatingFlagConsistency(db) {
    // Fix rating_submitted = 1 where ratings exist
    await new Promise((resolve) => {
      db.run(`
        UPDATE project_completion 
        SET rating_submitted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE project_id IN (SELECT DISTINCT project_id FROM ratings)
        AND rating_submitted = 0
      `, function(err) {
        if (!err) {
          console.log(`✅ Set rating_submitted=1 for ${this.changes} completion(s)`);
        }
        resolve();
      });
    });

    // Fix rating_submitted = 0 where no ratings exist
    await new Promise((resolve) => {
      db.run(`
        UPDATE project_completion 
        SET rating_submitted = 0, updated_at = CURRENT_TIMESTAMP
        WHERE project_id NOT IN (
          SELECT DISTINCT project_id FROM ratings WHERE project_id IS NOT NULL
        ) AND rating_submitted = 1
      `, function(err) {
        if (!err && this.changes > 0) {
          console.log(`✅ Set rating_submitted=0 for ${this.changes} completion(s)`);
        }
        resolve();
      });
    });
  }

  async fixStatusProgression(db) {
    return new Promise((resolve) => {
      db.run(`
        UPDATE projects 
        SET status = CASE 
          WHEN id IN (SELECT project_id FROM project_completion WHERE completion_status = 'completed') 
          THEN 'completed'
          WHEN id IN (SELECT project_id FROM project_bids WHERE status = 'accepted') 
          THEN 'in_progress'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT id FROM projects 
          WHERE (status = 'open' AND id IN (SELECT project_id FROM project_bids WHERE status = 'accepted'))
             OR (status = 'in_progress' AND id IN (SELECT project_id FROM project_completion WHERE completion_status = 'completed'))
        )
      `, function(err) {
        if (!err) {
          console.log(`✅ Fixed status progression for ${this.changes} project(s)`);
        }
        resolve();
      });
    });
  }
}

module.exports = DataConsistencyValidator;