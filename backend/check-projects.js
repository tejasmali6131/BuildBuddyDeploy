const { db } = require('./config/database-sqlite');

// Test script to check if projects are actually being saved to database
const checkProjects = async () => {
  try {
    console.log('🔍 Checking projects in database...');
    
    // Check all projects in database
    db.all("SELECT * FROM projects", [], (err, projects) => {
      if (err) {
        console.error('❌ Error querying projects:', err);
        return;
      }
      
      console.log(`📊 Total projects in database: ${projects.length}`);
      if (projects.length > 0) {
        console.log('📋 Projects found:');
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ID: ${project.id}, Title: "${project.title}", Customer: ${project.customer_id}, Status: ${project.status}`);
        });
      } else {
        console.log('📭 No projects found in database');
      }
      
      // Check all users too
      db.all("SELECT id, user_type, first_name, last_name, email FROM users", [], (err, users) => {
        if (err) {
          console.error('❌ Error querying users:', err);
          return;
        }
        
        console.log(`\n👥 Total users in database: ${users.length}`);
        if (users.length > 0) {
          console.log('👤 Users found:');
          users.forEach((user, index) => {
            console.log(`  ${index + 1}. ID: ${user.id}, Type: ${user.user_type}, Name: ${user.first_name} ${user.last_name}, Email: ${user.email}`);
          });
        }
        
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
};

checkProjects();