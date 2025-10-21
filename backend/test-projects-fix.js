// Test the updated projects route
const express = require('express');
const { db } = require('./config/database-sqlite');

console.log('Testing database connection...');

// Test if we can access the projects table
db.all("SELECT COUNT(*) as count FROM projects", (err, result) => {
  if (err) {
    console.error('❌ Error accessing projects table:', err.message);
  } else {
    console.log('✅ Projects table accessible!');
    console.log('Current projects count:', result[0].count);
    
    // Test a simple query similar to what the route does
    db.all(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.budget,
        p.start_date,
        p.end_date,
        p.customer_id,
        p.created_at,
        u.name as customer_name
      FROM projects p
      LEFT JOIN users u ON p.customer_id = u.id
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `, [1], (err, projects) => {
      if (err) {
        console.error('❌ Error fetching projects for customer 1:', err.message);
      } else {
        console.log('✅ Query successful!');
        console.log('Projects for customer 1:', projects.length);
        if (projects.length > 0) {
          console.log('Sample project:', projects[0]);
        }
      }
      process.exit();
    });
  }
});