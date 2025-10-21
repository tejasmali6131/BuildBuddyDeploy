const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'buildbuddy.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking and updating projects table...');

// First check if customer_email column exists
db.all("PRAGMA table_info(projects)", (err, columns) => {
  if (err) {
    console.error('Error checking table info:', err.message);
    return;
  }
  
  console.log('Current columns:', columns.map(c => c.name));
  
  const hasEmailColumn = columns.some(col => col.name === 'customer_email');
  
  if (!hasEmailColumn) {
    console.log('Adding customer_email column...');
    db.run("ALTER TABLE projects ADD COLUMN customer_email TEXT", (err) => {
      if (err) {
        console.error('Error adding column:', err.message);
      } else {
        console.log('✅ customer_email column added');
        updateExistingProjects();
      }
    });
  } else {
    console.log('customer_email column already exists');
    updateExistingProjects();
  }
});

function updateExistingProjects() {
  // Update existing projects with emails
  db.run(`
    UPDATE projects 
    SET customer_email = (
      SELECT email FROM users WHERE users.id = projects.customer_id
    )
    WHERE customer_email IS NULL OR customer_email = ''
  `, (err) => {
    if (err) {
      console.error('Error updating projects:', err.message);
    } else {
      console.log('✅ Updated existing projects with emails');
      
      // Show sample data
      db.all('SELECT id, title, customer_id, customer_email FROM projects LIMIT 3', (err, projects) => {
        if (err) {
          console.error('Error fetching sample:', err.message);
        } else {
          console.log('Sample projects:', projects);
        }
        db.close();
      });
    }
  });
}