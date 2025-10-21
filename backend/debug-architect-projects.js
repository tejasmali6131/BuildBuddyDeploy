const sqlite3 = require('sqlite3').verbose();const { db } = require('./config/database-sqlite');

const path = require('path');

console.log('Checking projects in database...');

const dbPath = path.join(__dirname, 'buildbuddy.db');

const db = new sqlite3.Database(dbPath);// First, check all projects and their statuses

db.all("SELECT id, title, status, customer_id, customer_email, created_at FROM projects ORDER BY created_at DESC", (err, allProjects) => {

console.log('=== DEBUG: Architect Projects Analysis ===');  if (err) {

    console.error('Error fetching all projects:', err.message);

// First, let's see all users  } else {

console.log('\n1. All users:');    console.log(`\n=== ALL PROJECTS (${allProjects.length}) ===`);

db.all('SELECT id, first_name, last_name, email, user_type FROM users', (err, users) => {    allProjects.forEach(project => {

  if (err) {      console.log(`${project.id}: "${project.title}" - Status: ${project.status} - Customer: ${project.customer_email}`);

    console.error('Error fetching users:', err);    });

    return;  }

  }

  console.table(users);  // Check what architects should see (open/in_progress projects)

  db.all(`

  // Find architects    SELECT 

  const architects = users.filter(u => u.user_type === 'architect');      p.id,

  console.log('\n2. Architects found:', architects.length);      p.title,

      p.status,

  if (architects.length > 0) {      p.customer_email,

    const firstArchitect = architects[0];      p.created_at

    console.log(`\n3. Analyzing architect: ${firstArchitect.first_name} ${firstArchitect.last_name} (ID: ${firstArchitect.id})`);    FROM projects p

    WHERE p.status IN ('open', 'in_progress')

    // Check their bids    ORDER BY p.created_at DESC

    const bidQuery = `  `, (err, architectProjects) => {

      SELECT b.*, p.title, p.status as project_status    if (err) {

      FROM project_bids b      console.error('Error fetching architect projects:', err.message);

      JOIN projects p ON b.project_id = p.id    } else {

      WHERE b.architect_id = ?      console.log(`\n=== ARCHITECT VISIBLE PROJECTS (${architectProjects.length}) ===`);

      ORDER BY b.submitted_at DESC      if (architectProjects.length > 0) {

    `;        architectProjects.forEach(project => {

          console.log(`${project.id}: "${project.title}" - Status: ${project.status}`);

    db.all(bidQuery, [firstArchitect.id], (err, bids) => {        });

      if (err) {      } else {

        console.error('Error fetching bids:', err);        console.log('❌ No projects with status "open" or "in_progress" found!');

        return;        console.log('This is why architects see no projects.');

      }      }

    }

      console.log(`\n4. Bids for architect ${firstArchitect.id}:`);

      console.table(bids);    // Check unique statuses in the database

    db.all("SELECT DISTINCT status FROM projects", (err, statuses) => {

      // Check accepted bids with in_progress projects      if (err) {

      const acceptedBids = bids.filter(b => b.status === 'accepted');        console.error('Error fetching statuses:', err.message);

      console.log(`\n5. Accepted bids: ${acceptedBids.length}`);      } else {

      if (acceptedBids.length > 0) {        console.log('\n=== EXISTING PROJECT STATUSES ===');

        console.table(acceptedBids);        statuses.forEach(s => console.log(`- "${s.status}"`));

      }      }

      process.exit();

      const activeProjects = acceptedBids.filter(b => b.project_status === 'in_progress');    });

      console.log(`\n6. Active projects (accepted bids + in_progress): ${activeProjects.length}`);  });

      if (activeProjects.length > 0) {});
        console.table(activeProjects);
      }

      // Now test the actual query used in the projects endpoint
      console.log('\n7. Testing projects endpoint query for in_progress projects:');
      const projectQuery = `
        SELECT 
          p.id,
          p.title,
          p.status,
          p.customer_id,
          COUNT(pb_all.id) as bid_count,
          my_bid.bid_amount as accepted_bid_amount
        FROM projects p
        LEFT JOIN users u ON p.customer_id = u.id
        LEFT JOIN project_bids pb_all ON p.id = pb_all.project_id
        INNER JOIN project_bids my_bid ON p.id = my_bid.project_id 
          AND my_bid.architect_id = ? AND my_bid.status = 'accepted'
        WHERE p.status = ?
        GROUP BY p.id, p.title, p.status, p.customer_id, my_bid.bid_amount
      `;

      db.all(projectQuery, [firstArchitect.id, 'in_progress'], (err, projects) => {
        if (err) {
          console.error('Error with project query:', err);
          return;
        }

        console.log(`Projects found with query: ${projects.length}`);
        if (projects.length > 0) {
          console.table(projects);
        } else {
          console.log('No projects found - this is why "No projects available" appears!');
        }

        // Check all in_progress projects to see what's available
        console.log('\n8. All in_progress projects in database:');
        db.all("SELECT id, title, status, customer_id FROM projects WHERE status = 'in_progress'", (err, allInProgress) => {
          if (err) {
            console.error('Error fetching all in_progress:', err);
            return;
          }
          console.table(allInProgress);
          db.close();
        });
      });
    });
  }
});