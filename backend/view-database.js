const { db, query } = require('./config/database-sqlite');

async function viewDatabase() {
  console.log('📊 BuildBuddy Database Contents');
  console.log('================================\n');

  try {
    // Check users table
    const users = await query('SELECT * FROM users');
    console.log('👥 USERS TABLE:');
    if (users.length === 0) {
      console.log('   No users found - database is empty');
    } else {
      users.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Type: ${user.user_type}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('   ---');
      });
    }

    // Check customer profiles
    const customerProfiles = await query('SELECT * FROM customer_profiles');
    console.log('\n🏠 CUSTOMER PROFILES:');
    if (customerProfiles.length === 0) {
      console.log('   No customer profiles found');
    } else {
      customerProfiles.forEach(profile => {
        console.log(`   User ID: ${profile.user_id}`);
        console.log(`   Project Type: ${profile.project_type || 'Not specified'}`);
        console.log(`   Budget: ${profile.budget_range || 'Not specified'}`);
        console.log(`   Completed: ${profile.profile_completed ? 'Yes' : 'No'}`);
        console.log('   ---');
      });
    }

    // Check architect profiles
    const architectProfiles = await query('SELECT * FROM architect_profiles');
    console.log('\n🏗️ ARCHITECT PROFILES:');
    if (architectProfiles.length === 0) {
      console.log('   No architect profiles found');
    } else {
      architectProfiles.forEach(profile => {
        console.log(`   User ID: ${profile.user_id}`);
        console.log(`   Company: ${profile.company_name || 'Not specified'}`);
        console.log(`   License: ${profile.license_number || 'Not specified'}`);
        console.log(`   Experience: ${profile.years_experience || 'Not specified'} years`);
        console.log(`   Specialization: ${profile.specialization || 'Not specified'}`);
        console.log('   ---');
      });
    }

    // Get database stats
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const totalCustomers = await query('SELECT COUNT(*) as count FROM users WHERE user_type = "customer"');
    const totalArchitects = await query('SELECT COUNT(*) as count FROM users WHERE user_type = "architect"');

    console.log('\n📈 DATABASE STATS:');
    console.log(`   Total Users: ${totalUsers[0].count}`);
    console.log(`   Customers: ${totalCustomers[0].count}`);
    console.log(`   Architects: ${totalArchitects[0].count}`);

  } catch (error) {
    console.error('❌ Error viewing database:', error);
  } finally {
    db.close();
  }
}

viewDatabase();