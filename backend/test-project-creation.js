const { db } = require('./config/database-sqlite');

// Simulate a project creation request
const testProjectData = {
  title: 'Test Project',
  description: 'Test Description',
  project_type: 'Apartment Complex',
  location: 'Test Location',
  area_sqft: 1000,
  budget_min: 50000,
  budget_max: 100000,
  timeline: '6 months',
  requirements: 'Test requirements',
  priority: 'medium',
  customer_id: 1,
  customer_email: 'tejas@gmail.com'
};

console.log('Testing project creation...');

// First check if table exists and structure
db.all("PRAGMA table_info(projects)", (err, columns) => {
  if (err) {
    console.error('Error checking table:', err.message);
    return;
  }
  
  console.log('Table columns:', columns.map(c => `${c.name} (${c.type})`));
  
  // Try to insert a test project
  const query = `
    INSERT INTO projects (title, description, project_type, location, area_sqft, budget_min, budget_max, timeline, requirements, priority, customer_id, customer_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    testProjectData.title,
    testProjectData.description,
    testProjectData.project_type,
    testProjectData.location,
    testProjectData.area_sqft,
    testProjectData.budget_min,
    testProjectData.budget_max,
    testProjectData.timeline,
    testProjectData.requirements,
    testProjectData.priority,
    testProjectData.customer_id,
    testProjectData.customer_email
  ], function(err) {
    if (err) {
      console.error('❌ Error creating test project:', err.message);
    } else {
      console.log('✅ Test project created with ID:', this.lastID);
      
      // Try to fetch it back
      db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, project) => {
        if (err) {
          console.error('Error fetching created project:', err.message);
        } else {
          console.log('✅ Successfully fetched created project:');
          console.log(project);
        }
        process.exit();
      });
    }
  });
});