const { db } = require('./config/database-sqlite');

console.log('Testing the fixed SQL query...');

// Test the query that was failing
const query = `
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
  WHERE p.customer_email = ? OR p.customer_id = ?
  ORDER BY p.created_at DESC
`;

db.all(query, ['tejas@gmail.com', 1], (err, rows) => {
  if (err) {
    console.error('❌ Query still has errors:', err.message);
  } else {
    console.log('✅ Query works! Found projects:', rows.length);
    if (rows.length > 0) {
      console.log('Sample project:');
      console.log({
        id: rows[0].id,
        title: rows[0].title,
        customer_name: rows[0].customer_name,
        customer_email: rows[0].customer_email
      });
    }
  }
  process.exit();
});