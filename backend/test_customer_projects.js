const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./buildbuddy.db');

// Test customer projects query to see what data is being returned
const query = `
  SELECT 
    p.id,
    p.title,
    p.status,
    p.customer_id,
    COUNT(pb.id) as bid_count,
    accepted_bids.bid_amount as accepted_bid_amount,
    accepted_bids.architect_id as accepted_architect_id,
    (accepted_architect.first_name || ' ' || accepted_architect.last_name) as accepted_architect_name
  FROM projects p
  LEFT JOIN project_bids pb ON p.id = pb.project_id
  LEFT JOIN (
    SELECT project_id, bid_amount, architect_id
    FROM project_bids 
    WHERE status = 'accepted'
  ) accepted_bids ON p.id = accepted_bids.project_id
  LEFT JOIN users accepted_architect ON accepted_bids.architect_id = accepted_architect.id
  WHERE p.customer_id = 1
  GROUP BY p.id, p.title, p.status, p.customer_id, accepted_bids.architect_id, accepted_architect.first_name, accepted_architect.last_name
  ORDER BY p.created_at DESC
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Customer projects for customer_id=1:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Check for projects that should show "Mark as Completed" button
    const completableProjects = rows.filter(p => 
      p.status === 'in_progress' && p.accepted_architect_id
    );
    
    console.log('\nProjects that should show "Mark as Completed" button:');
    console.log(completableProjects.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      accepted_architect_id: p.accepted_architect_id,
      accepted_architect_name: p.accepted_architect_name
    })));
  }
  db.close();
});