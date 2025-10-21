const { db } = require('./config/database-sqlite');

console.log('Testing architect projects query...');

// Test the architect query
const architectQuery = `
  SELECT 
    p.id,
    p.title,
    p.description,
    p.project_type,
    p.location,
    p.area_sqft,
    p.budget_min,
    p.budget_max,
    p.timeline,
    p.requirements,
    p.priority,
    p.status,
    p.customer_id,
    p.customer_email,
    p.created_at,
    (u.first_name || ' ' || u.last_name) as customer_name
  FROM projects p
  LEFT JOIN users u ON p.customer_id = u.id
  WHERE p.status IN ('open', 'in_progress')
  ORDER BY p.created_at DESC
`;

db.all(architectQuery, [], (err, rows) => {
  if (err) {
    console.error('❌ Architect query failed:', err.message);
  } else {
    console.log('✅ Architect query successful!');
    console.log(`Found ${rows.length} projects available to architects`);
    
    if (rows.length > 0) {
      console.log('\nSample projects:');
      rows.forEach((project, index) => {
        console.log(`${index + 1}. "${project.title}" by ${project.customer_name} (${project.status})`);
      });
    } else {
      console.log('No projects with status "open" or "in_progress" found');
    }
  }
  process.exit();
});