const jwt = require('jsonwebtoken');

// Test JWT token generation and verification
const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
console.log('JWT Secret being used:', secret);

const testPayload = { userId: 2 };

// Generate token
const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
console.log('Generated token:', token);

// Verify token
try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verification successful:', decoded);
} catch (error) {
    console.log('❌ Token verification failed:', error.message);
}

// Test with a simple HTTP request to our own server
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ratings/my-ratings',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response body:', data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();