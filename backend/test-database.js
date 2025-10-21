const { db } = require('./config/database-sqlite');

// Test script to verify database tables exist and are accessible
const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection and tables...');
    
    // Test if we can query tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error('❌ Error querying database:', err);
        return;
      }
      
      console.log('✅ Found tables:', rows.map(row => row.name));
      
      // Test specific queries that were failing
      db.all("SELECT COUNT(*) as count FROM projects", [], (err, result) => {
        if (err) {
          console.error('❌ Error querying projects table:', err);
        } else {
          console.log('✅ Projects table accessible, count:', result[0].count);
        }
        
        db.all("SELECT COUNT(*) as count FROM users", [], (err, result) => {
          if (err) {
            console.error('❌ Error querying users table:', err);
          } else {
            console.log('✅ Users table accessible, count:', result[0].count);
          }
          
          console.log('🎉 Database test completed!');
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
};

testDatabase();