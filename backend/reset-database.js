const fs = require('fs');
const path = require('path');

// Script to reset the database completely
const resetDatabase = async () => {
  try {
    console.log('🗄️  Resetting BuildBuddy database...');
    
    // Try to delete existing database file if it exists and is not locked
    const dbPath = path.join(__dirname, 'buildbuddy.db');
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
        console.log('✅ Deleted existing database file');
      } catch (error) {
        if (error.code === 'EBUSY') {
          console.log('⚠️  Database file is locked (server might be running)');
          console.log('⚠️  Will recreate tables in existing database');
        } else {
          throw error;
        }
      }
    }
    
    // Import and initialize database
    const { initializeDatabase } = require('./config/database-sqlite');
    await initializeDatabase();
    console.log('✅ Database reset and initialized successfully');
    
    console.log('\n🎉 Database is ready! You can now start the server.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    process.exit(1);
  }
};

resetDatabase();