import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import { UserModel } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../../src/configs/constant';

describe('Auth Module Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sajilo_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up database
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await UserModel.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    test('Register success - should create new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('username', userData.username);
      expect(response.body.data).not.toHaveProperty('password'); // Password should not be returned
    });

    test('Register validation - should fail with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Missing fields - should fail when required fields are missing', async () => {
      const userData = {
        firstName: 'John',
        email: 'john@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Duplicate email - should fail when email already exists', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
    });

    test('Duplicate username - should fail when username already exists', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        username: 'johndoe', // Same username
        password: 'password123',
        phoneNumber: '0987654321',
        gender: 'female',
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData1);

      // Try to register with same username
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData2)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('Login success - should return user and token', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      // Register user first
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Login
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
    });

    test('Login invalid credentials - should fail with wrong password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      // Register user first
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Login with wrong password
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid password');
    });

    test('Login with non-existent email - should fail', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email');
    });
  });

  describe('Password hashing check', () => {
    test('Password should be hashed before saving to database', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const user = await UserModel.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user?.password).not.toBe(userData.password); // Password should be hashed
      expect(user?.password.length).toBeGreaterThan(20); // Hashed passwords are longer
    });
  });

  describe('Protected routes', () => {
    let authToken: string;

    beforeEach(async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phoneNumber: '1234567890',
        gender: 'male',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userData.email, password: userData.password });

      authToken = loginResponse.body.data.token;
    });

    test('Unauthorized access - should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/whoami')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Invalid JWT - should fail with malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/whoami')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Invalid JWT - should fail with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: '123', email: 'test@example.com', role: 'user' },
        SECRET_KEY,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/v1/auth/whoami')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Valid JWT - should access protected route successfully', async () => {
      const response = await request(app)
        .get('/api/v1/auth/whoami')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User details fetched successfully');
      expect(response.body.data).toHaveProperty('email', 'john@example.com');
    });
  });
});
