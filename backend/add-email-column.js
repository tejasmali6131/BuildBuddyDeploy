const { db } = require('./config/database-sqlite');

console.log('Adding customer_email column to projects table...');

// Add customer_email column if it doesn't exist
db.run(`ALTER TABLE projects ADD COLUMN customer_email TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding customer_email column:', err.message);
  } else {
    console.log('✅ customer_email column added or already exists');
    
    // Update existing projects with email from users table
    db.run(`
      UPDATE projects 
      SET customer_email = (
        SELECT email FROM users WHERE users.id = projects.customer_id
      )
      WHERE customer_email IS NULL
    `, (err) => {
      if (err) {
        console.error('Error updating existing projects with emails:', err.message);
      } else {
        console.log('✅ Updated existing projects with customer emails');
        
        // Check the results
        db.all('SELECT id, title, customer_email FROM projects LIMIT 5', (err, projects) => {
          if (err) {
            console.error('Error checking projects:', err.message);
          } else {
            console.log('Sample projects with emails:', projects);
          }
          process.exit();
        });
      }
    });
  }
});