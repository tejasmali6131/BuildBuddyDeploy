const { db } = require('./config/database-sqlite');

console.log('Checking database tables...');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error checking tables:', err.message);
  } else {
    console.log('Existing tables:', tables.map(t => t.name));
    
    // Check if projects table exists
    if (tables.find(t => t.name === 'projects')) {
      console.log('✅ Projects table exists!');
      
      // Count existing projects
      db.all("SELECT COUNT(*) as count FROM projects", (err, result) => {
        if (err) {
          console.error('Error counting projects:', err.message);
        } else {
          console.log('Existing projects count:', result[0].count);
        }
        process.exit();
      });
    } else {
      console.log('❌ Projects table not found');
      process.exit();
    }
  }
});