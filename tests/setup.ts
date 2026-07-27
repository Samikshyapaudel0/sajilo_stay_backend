// Test setup file for Jest
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/sajilo_test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test_password';
