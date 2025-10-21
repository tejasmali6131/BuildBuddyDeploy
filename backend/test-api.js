const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // You may need to install this

// Test script to simulate exactly what the frontend should be doing
const testProjectFetch = async () => {
  try {
    console.log('🔧 Testing project fetch API...');
    
    // Create a test JWT token like the one the frontend should have
    const testToken = jwt.sign(
      { 
        userId: 1, 
        email: 'tejas@gmail.com', 
        userType: 'customer' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('📝 Generated test token for user ID 1');
    console.log('🔑 Token payload:', jwt.decode(testToken));
    
    // Test the API call
    console.log('\n🌐 Making API request to /api/projects...');
    const response = await fetch('http://localhost:5000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('\n📊 API Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.projects) {
      console.log(`\n✅ SUCCESS: Found ${data.projects.length} projects`);
    } else {
      console.log('\n❌ FAILED: No projects returned or error occurred');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 5000');
    }
  }
};

testProjectFetch();