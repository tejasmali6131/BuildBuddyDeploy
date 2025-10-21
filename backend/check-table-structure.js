const { db } = require('./config/database-sqlite');

console.log('Checking users table structure...');

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error('Error checking users table:', err.message);
  } else {
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // Also check projects table
    db.all("PRAGMA table_info(projects)", (err, projectColumns) => {
      if (err) {
        console.error('Error checking projects table:', err.message);
      } else {
        console.log('\nProjects table columns:');
        projectColumns.forEach(col => {
          console.log(`- ${col.name} (${col.type})`);
        });
      }
      process.exit();
    });
  }
});