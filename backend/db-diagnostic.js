// Simple database diagnostic script
const express = require('express');
const { db } = require('./config/database-sqlite');

console.log('=== DATABASE DIAGNOSTIC ===');

// Test 1: Check if we can connect to database
console.log('1. Testing database connection...');

// Test 2: Check table structure
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Error checking tables:', err.message);
    return;
  }
  
  console.log('2. Database tables found:', tables.map(t => t.name));
  
  // Test 3: Check projects table specifically
  if (tables.find(t => t.name === 'projects')) {
    console.log('✅ Projects table exists');
    
    // Test 4: Check projects table structure
    db.all("PRAGMA table_info(projects)", (err, columns) => {
      if (err) {
        console.error('❌ Error checking projects structure:', err.message);
      } else {
        console.log('3. Projects table columns:', columns.map(c => c.name));
      }
      
      // Test 5: Count projects
      db.all("SELECT COUNT(*) as count FROM projects", (err, result) => {
        if (err) {
          console.error('❌ Error counting projects:', err.message);
        } else {
          const count = result[0].count;
          console.log(`4. Total projects in database: ${count}`);
          
          if (count > 0) {
            // Test 6: Show sample projects
            db.all("SELECT id, title, status, customer_email FROM projects LIMIT 3", (err, projects) => {
              if (err) {
                console.error('❌ Error fetching sample projects:', err.message);
              } else {
                console.log('5. Sample projects:');
                projects.forEach(p => {
                  console.log(`   - ${p.id}: "${p.title}" (${p.status || 'NULL'}) - ${p.customer_email || 'No email'}`);
                });
              }
              
              // Test 7: Test architect query
              testArchitectQuery();
            });
          } else {
            console.log('5. No projects found - this might be the issue!');
            testArchitectQuery();
          }
        }
      });
    });
  } else {
    console.log('❌ Projects table does NOT exist - this is the problem!');
    process.exit(1);
  }
});

function testArchitectQuery() {
  console.log('6. Testing architect query...');
  const query = `
    SELECT 
      p.id,
      p.title,
      p.status,
      p.customer_email,
      (u.first_name || ' ' || u.last_name) as customer_name
    FROM projects p
    LEFT JOIN users u ON p.customer_id = u.id
    ORDER BY p.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Architect query failed:', err.message);
    } else {
      console.log(`✅ Architect query successful: ${rows.length} projects found`);
      if (rows.length > 0) {
        console.log('   Sample results:');
        rows.slice(0, 2).forEach(p => {
          console.log(`   - ${p.id}: "${p.title}" by ${p.customer_name || 'Unknown'}`);
        });
      }
    }
    
    console.log('\n=== DIAGNOSTIC COMPLETE ===');
    process.exit(0);
  });
}