const { db } = require('./config/database-sqlite');

console.log('Checking database tables...');

// Use sqlite3 async methods properly
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err.message);
        return;
    }
    
    console.log('Table names:');
    tables.forEach(table => {
        console.log('-', table.name);
    });
    
    // Check for any architect-related tables
    const archTables = tables.filter(t => t.name.includes('architect'));
    console.log('\nArchitect-related tables:');
    archTables.forEach(table => {
        console.log('-', table.name);
    });
    
    // Check if architect_profiles exists
    const hasArchitectProfiles = tables.some(t => t.name === 'architect_profiles');
    console.log('\narchitect_profiles table exists:', hasArchitectProfiles);
    
    // Check if there's any 'architects_data' table
    const hasArchitectsData = tables.some(t => t.name === 'architects_data');
    console.log('architects_data table exists:', hasArchitectsData);
    
    db.close();
});