const { db } = require('./config/database-sqlite');

console.log('Fixing project statuses for architect visibility...');

// First, check current projects
db.all("SELECT id, title, status, customer_email FROM projects", (err, projects) => {
  if (err) {
    console.error('Error fetching projects:', err.message);
    return;
  }

  console.log('\n=== CURRENT PROJECTS ===');
  projects.forEach(p => {
    console.log(`${p.id}: "${p.title}" - Status: ${p.status || 'NULL'}`);
  });

  // Update projects that have NULL or undefined status to 'open'
  db.run("UPDATE projects SET status = 'open' WHERE status IS NULL OR status = ''", (err) => {
    if (err) {
      console.error('Error updating project statuses:', err.message);
    } else {
      console.log('\n✅ Updated projects with missing status to "open"');
    }

    // Check results
    db.all("SELECT id, title, status FROM projects", (err, updatedProjects) => {
      if (err) {
        console.error('Error fetching updated projects:', err.message);
      } else {
        console.log('\n=== UPDATED PROJECTS ===');
        updatedProjects.forEach(p => {
          console.log(`${p.id}: "${p.title}" - Status: ${p.status}`);
        });

        // Test architect query
        db.all(`
          SELECT id, title, status 
          FROM projects 
          WHERE status IN ('open', 'in_progress')
        `, (err, architectVisible) => {
          if (err) {
            console.error('Error testing architect query:', err.message);
          } else {
            console.log(`\n=== ARCHITECT VISIBLE PROJECTS (${architectVisible.length}) ===`);
            architectVisible.forEach(p => {
              console.log(`${p.id}: "${p.title}" - Status: ${p.status}`);
            });
          }
          process.exit();
        });
      }
    });
  });
});