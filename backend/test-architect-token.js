const jwt = require('jsonwebtoken');

// Create a test architect token
const architectUser = {
  userId: 2,
  userType: 'architect',
  email: 'architect@test.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
};

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
const architectToken = jwt.sign(architectUser, jwtSecret);

console.log('Test architect token created:');
console.log('Bearer', architectToken);
console.log('\nDecoded payload:', jwt.decode(architectToken));

console.log('\nTo test architect access, use this token in your request headers:');
console.log(`Authorization: Bearer ${architectToken}`);