const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection with absolute path
const dbPath = path.resolve(__dirname, 'database.db');
console.log('Connecting to database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// First, check existing tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error checking tables:', err.message);
    return;
  }
  
  console.log('Existing tables:', tables.map(t => t.name));
  
  // Create projects table if it doesn't exist
  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Planning',
      budget REAL,
      start_date TEXT,
      end_date TEXT,
      customer_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users (id)
    )
  `;
  
  db.run(createProjectsTable, (err) => {
    if (err) {
      console.error('Error creating projects table:', err.message);
    } else {
      console.log('Projects table created successfully');
      
      // Check if table was created
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, updatedTables) => {
        if (err) {
          console.error('Error checking updated tables:', err.message);
        } else {
          console.log('Updated tables:', updatedTables.map(t => t.name));
          
          // Check if there are any existing projects
          db.all("SELECT COUNT(*) as count FROM projects", (err, result) => {
            if (err) {
              console.error('Error counting projects:', err.message);
            } else {
              console.log('Existing projects count:', result[0].count);
            }
            
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err.message);
              } else {
                console.log('Database connection closed');
              }
            });
          });
        }
      });
    }
  });
});