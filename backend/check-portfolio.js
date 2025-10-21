const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./buildbuddy.db');

console.log('Checking portfolio data...');

// Check if portfolios table exists and has data
db.all("SELECT COUNT(*) as count FROM portfolios", (err, result) => {
  if (err) {
    console.error('Error checking portfolios table:', err);
  } else {
    console.log('Total portfolios in database:', result[0].count);
  }
  
  // Get some sample portfolio data
  db.all("SELECT id, architect_id, title, description FROM portfolios LIMIT 5", (err, portfolios) => {
    if (err) {
      console.error('Error fetching sample portfolios:', err);
    } else {
      console.log('Sample portfolios:', portfolios);
    }
    
    // Check which architects have portfolios
    db.all("SELECT architect_id, COUNT(*) as portfolio_count FROM portfolios GROUP BY architect_id", (err, architects) => {
      if (err) {
        console.error('Error checking architects with portfolios:', err);
      } else {
        console.log('Architects with portfolios:', architects);
      }
      
      db.close();
    });
  });
});