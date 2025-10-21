const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const db = new sqlite3.Database('./buildbuddy.db');

console.log('Testing authentication and API access...');

// Get the architect user
db.get("SELECT * FROM users WHERE user_type = 'architect' LIMIT 1", (err, user) => {
    if (err) {
        console.error('Error fetching architect user:', err);
        db.close();
        return;
    }
    
    if (!user) {
        console.log('❌ No architect user found');
        db.close();
        return;
    }
    
    console.log('✅ Found architect user:', { id: user.id, email: user.email, user_type: user.user_type });
    
    // Create a test token for this user
    const testToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1h' }
    );
    
    console.log('Generated test token:', testToken);
    console.log('You can use this token to test the API endpoints:');
    console.log('curl -H "Authorization: Bearer ' + testToken + '" http://localhost:5000/api/ratings/my-ratings');
    
    db.close();
});