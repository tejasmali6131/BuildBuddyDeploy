const jwt = require('jsonwebtoken');

// Simple script to generate a test token and show the curl command
const generateTestInfo = () => {
  try {
    console.log('🔧 Generating test information...');
    
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
    console.log('\n💾 Full token:');
    console.log(testToken);
    
    console.log('\n🌐 Test this API call manually:');
    console.log(`curl -H "Authorization: Bearer ${testToken}" http://localhost:5000/api/projects`);
    
    console.log('\n🔍 Or test in browser console:');
    console.log(`fetch('/api/projects', {
  headers: { 'Authorization': 'Bearer ${testToken}' }
}).then(r => r.json()).then(console.log)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

generateTestInfo();