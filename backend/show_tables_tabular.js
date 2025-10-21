const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('buildbuddy.db');

console.log('🗄️  DATABASE TABLES IN TABULAR FORMAT\n');

// Function to display table in tabular format
function displayTable(tableName, title) {
  return new Promise((resolve) => {
    console.log(`\n📋 ${title}`);
    console.log('═'.repeat(title.length + 4));
    
    db.all(`SELECT * FROM ${tableName} ORDER BY id`, (err, rows) => {
      if (err) {
        console.log(`❌ Error: ${err.message}`);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log('📭 No records found\n');
        resolve();
        return;
      }
      
      // Get column names
      const columns = Object.keys(rows[0]);
      
      // Calculate column widths
      const colWidths = {};
      columns.forEach(col => {
        colWidths[col] = Math.max(
          col.length,
          ...rows.map(row => {
            let val = row[col];
            if (val === null) val = 'NULL';
            if (typeof val === 'string' && val.length > 30) val = val.substring(0, 27) + '...';
            return String(val).length;
          })
        );
        // Minimum width of 8, maximum width of 30
        colWidths[col] = Math.max(8, Math.min(30, colWidths[col]));
      });
      
      // Print header
      let headerRow = '│';
      columns.forEach(col => {
        headerRow += ` ${col.padEnd(colWidths[col])} │`;
      });
      console.log(headerRow);
      
      // Print separator
      let separator = '├';
      columns.forEach(col => {
        separator += '─'.repeat(colWidths[col] + 2) + '┼';
      });
      separator = separator.slice(0, -1) + '┤';
      console.log(separator);
      
      // Print data rows
      rows.forEach(row => {
        let dataRow = '│';
        columns.forEach(col => {
          let val = row[col];
          if (val === null) val = 'NULL';
          if (typeof val === 'string' && val.length > 30) {
            val = val.substring(0, 27) + '...';
          }
          dataRow += ` ${String(val).padEnd(colWidths[col])} │`;
        });
        console.log(dataRow);
      });
      
      // Print bottom border
      let bottomBorder = '└';
      columns.forEach(col => {
        bottomBorder += '─'.repeat(colWidths[col] + 2) + '┴';
      });
      bottomBorder = bottomBorder.slice(0, -1) + '┘';
      console.log(bottomBorder);
      
      console.log(`\n📊 Total Records: ${rows.length}\n`);
      resolve();
    });
  });
}

async function showAllTables() {
  try {
    await displayTable('projects', 'PROJECTS TABLE');
    await displayTable('project_bids', 'PROJECT BIDS TABLE');
    await displayTable('project_completion', 'PROJECT COMPLETION TABLE');
    await displayTable('ratings', 'RATINGS TABLE');
    await displayTable('users', 'USERS TABLE');
    await displayTable('architect_profiles', 'ARCHITECT PROFILES TABLE');
    
    console.log('\n🔗 TABLE RELATIONSHIPS SUMMARY:');
    console.log('────────────────────────────────');
    console.log('projects.customer_id → users.id');
    console.log('project_bids.project_id → projects.id');
    console.log('project_bids.architect_id → users.id');
    console.log('project_completion.project_id → projects.id');
    console.log('project_completion.architect_id → users.id');
    console.log('project_completion.customer_id → users.id');
    console.log('ratings.project_id → projects.id');
    console.log('ratings.architect_id → users.id');
    console.log('ratings.customer_id → users.id');
    console.log('architect_profiles.user_id → users.id');
    
  } catch (error) {
    console.error('Error displaying tables:', error);
  } finally {
    db.close();
    console.log('\n✅ Database display complete!');
  }
}

showAllTables();