const { db } = require('./config/database-sqlite');

console.log('Comprehensive database check and fix...');

// Step 1: Check table structure
db.all("PRAGMA table_info(projects)", (err, columns) => {
  if (err) {
    console.error('Error checking table structure:', err.message);
    return;
  }

  console.log('\n=== PROJECTS TABLE STRUCTURE ===');
  columns.forEach(col => {
    console.log(`${col.name}: ${col.type} (Default: ${col.dflt_value || 'NULL'})`);
  });

  const hasEmailColumn = columns.some(col => col.name === 'customer_email');
  console.log(`\nCustomer email column exists: ${hasEmailColumn}`);

  // Step 2: Add email column if missing
  if (!hasEmailColumn) {
    console.log('\nAdding customer_email column...');
    db.run("ALTER TABLE projects ADD COLUMN customer_email TEXT", (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding email column:', err.message);
      } else {
        console.log('✅ Customer email column added');
        updateProjectsWithEmail();
      }
    });
  } else {
    updateProjectsWithEmail();
  }
});

function updateProjectsWithEmail() {
  // Step 3: Update projects with customer emails
  db.run(`
    UPDATE projects 
    SET customer_email = (
      SELECT email FROM users WHERE users.id = projects.customer_id
    )
    WHERE customer_email IS NULL OR customer_email = ''
  `, (err) => {
    if (err) {
      console.error('Error updating customer emails:', err.message);
    } else {
      console.log('✅ Updated customer emails');
    }

    // Step 4: Fix statuses
    db.run("UPDATE projects SET status = 'open' WHERE status IS NULL OR status = ''", (err) => {
      if (err) {
        console.error('Error updating statuses:', err.message);
      } else {
        console.log('✅ Updated project statuses');
      }

      // Step 5: Show final results
      db.all(`
        SELECT 
          id, 
          title, 
          status, 
          customer_id, 
          customer_email,
          created_at
        FROM projects 
        ORDER BY created_at DESC
      `, (err, projects) => {
        if (err) {
          console.error('Error fetching final results:', err.message);
        } else {
          console.log(`\n=== FINAL PROJECTS (${projects.length}) ===`);
          projects.forEach(p => {
            console.log(`${p.id}: "${p.title}" - Status: ${p.status} - Email: ${p.customer_email}`);
          });
        }
        process.exit();
      });
    });
  });
}