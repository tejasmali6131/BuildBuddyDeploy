const { db } = require('./config/database-sqlite');

console.log('🔍 Checking Architect Dashboard Statistics Data...\n');

// First, let's see what users we have
console.log('1. Checking users:');
db.all("SELECT id, first_name, last_name, email, user_type FROM users WHERE user_type = 'architect'", (err, architects) => {
  if (err) {
    console.error('❌ Error fetching architects:', err.message);
    return;
  }
  
  console.log(`Found ${architects.length} architects:`);
  architects.forEach(arch => {
    console.log(`   - ${arch.id}: ${arch.first_name} ${arch.last_name} (${arch.email})`);
  });

  if (architects.length === 0) {
    console.log('\n❗ No architects found. Creating a test architect...');
    
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync('password123', saltRounds);
    
    const insertArchitect = `
      INSERT INTO users (first_name, last_name, email, password, user_type, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    db.run(insertArchitect, ['John', 'Architect', 'architect@test.com', hashedPassword, 'architect'], function(err) {
      if (err) {
        console.error('❌ Error creating test architect:', err.message);
        return;
      }
      
      console.log(`✅ Test architect created with ID: ${this.lastID}`);
      checkProjectsAndBids(this.lastID);
    });
  } else {
    checkProjectsAndBids(architects[0].id);
  }
});

function checkProjectsAndBids(architectId) {
  console.log('\n2. Checking projects:');
  db.all("SELECT id, title, status, customer_id FROM projects", (err, projects) => {
    if (err) {
      console.error('❌ Error fetching projects:', err.message);
      return;
    }
    
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(proj => {
      console.log(`   - ${proj.id}: "${proj.title}" (${proj.status}) - Customer: ${proj.customer_id}`);
    });

    console.log('\n3. Checking bids:');
    db.all("SELECT * FROM project_bids WHERE architect_id = ?", [architectId], (err, bids) => {
      if (err) {
        console.error('❌ Error fetching bids:', err.message);
        return;
      }
      
      console.log(`Found ${bids.length} bids for architect ${architectId}:`);
      bids.forEach(bid => {
        console.log(`   - Project ${bid.project_id}: ₹${bid.bid_amount} (${bid.status})`);
      });

      if (bids.length === 0 && projects.length > 0) {
        console.log('\n❗ No bids found. Creating test bids...');
        createTestBids(architectId, projects);
      } else {
        console.log('\n4. Testing dashboard stats query...');
        testDashboardStats(architectId);
      }
    });
  });
}

function createTestBids(architectId, projects) {
  const testBids = [
    {
      projectId: projects[0]?.id,
      bidAmount: 150000,
      estimatedDuration: '3 months',
      proposalDescription: 'I can deliver this project with modern design and sustainable materials.',
      status: 'accepted'
    },
    {
      projectId: projects[1]?.id || projects[0]?.id,
      bidAmount: 200000,
      estimatedDuration: '4 months',
      proposalDescription: 'Experienced architect with 10+ years in residential design.',
      status: 'pending'
    }
  ];

  let completedBids = 0;
  testBids.forEach((bid, index) => {
    if (bid.projectId) {
      const insertBid = `
        INSERT INTO project_bids (
          project_id, architect_id, bid_amount, estimated_duration, 
          proposal_description, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(insertBid, [
        bid.projectId, architectId, bid.bidAmount, bid.estimatedDuration,
        bid.proposalDescription, bid.status
      ], function(err) {
        if (err) {
          console.error(`❌ Error creating bid ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Test bid ${index + 1} created with ID: ${this.lastID}`);
        }
        
        completedBids++;
        if (completedBids === testBids.length) {
          console.log('\n4. Testing dashboard stats query...');
          testDashboardStats(architectId);
        }
      });
    } else {
      completedBids++;
    }
  });
}

function testDashboardStats(architectId) {
  // Test the same queries used in the API
  const queries = {
    activeProjects: `
      SELECT COUNT(*) as count
      FROM project_bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.architect_id = ? AND b.status = 'accepted' AND p.status IN ('in_progress', 'completed')
    `,
    totalClients: `
      SELECT COUNT(DISTINCT p.customer_id) as count
      FROM project_bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.architect_id = ? AND b.status = 'accepted'
    `,
    totalReviews: `
      SELECT COUNT(*) as count
      FROM project_bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.architect_id = ? AND b.status = 'accepted' AND p.status = 'completed'
    `,
    newInquiries: `
      SELECT COUNT(*) as count
      FROM project_bids b
      WHERE b.architect_id = ? 
      AND b.status = 'pending' 
      AND date(b.submitted_at) >= date('now', '-30 days')
    `
  };

  console.log(`\nTesting dashboard statistics for architect ${architectId}:`);

  db.get(queries.activeProjects, [architectId], (err, result1) => {
    if (err) console.error('❌ Active projects query error:', err.message);
    else console.log(`✅ Active Projects: ${result1.count}`);

    db.get(queries.totalClients, [architectId], (err, result2) => {
      if (err) console.error('❌ Total clients query error:', err.message);
      else console.log(`✅ Total Clients: ${result2.count}`);

      db.get(queries.totalReviews, [architectId], (err, result3) => {
        if (err) console.error('❌ Total reviews query error:', err.message);
        else console.log(`✅ Total Reviews: ${result3.count}`);

        db.get(queries.newInquiries, [architectId], (err, result4) => {
          if (err) console.error('❌ New inquiries query error:', err.message);
          else console.log(`✅ New Inquiries: ${result4.count}`);

          console.log('\n🎉 Dashboard statistics test complete!');
          process.exit(0);
        });
      });
    });
  });
}