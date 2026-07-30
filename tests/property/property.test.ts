import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import { PropertyModel } from '../../src/models/property.model';
import { UserModel } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../../src/configs/constant';

describe('Property Module Tests', () => {
  let hostToken: string;
  let adminToken: string;
  let hostId: string;
  let adminId: string;
  let propertyId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sajilo_test';
    await mongoose.connect(mongoUri);
    // Clean up database before running tests
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up database
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create a host user
    const hostUser = await UserModel.create({
      firstName: 'Host',
      lastName: 'User',
      email: 'host@example.com',
      username: 'hostuser',
      password: 'password123',
      phoneNumber: '1234567890',
      gender: 'male',
      role: 'host',
    });
    hostId = hostUser._id.toString();
    hostToken = jwt.sign(
      { id: hostId, email: hostUser.email, role: 'host' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Create an admin user
    const adminUser = await UserModel.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'password123',
      phoneNumber: '0987654321',
      gender: 'female',
      role: 'admin',
    });
    adminId = adminUser._id.toString();
    adminToken = jwt.sign(
      { id: adminId, email: adminUser.email, role: 'admin' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Create a test property with 'house' category to avoid conflicts with category filter tests
    const property = await PropertyModel.create({
      title: 'Test Property',
      description: 'A beautiful test property',
      location: 'Test Location',
      pricePerNight: 100,
      category: 'house',
      amenities: ['wifi', 'parking'],
      images: ['image1.jpg'],
      status: 'available',
      hostId: hostId,
    });
    propertyId = property._id.toString();
  });

  describe('POST /api/v1/host/properties - Create Property', () => {
    test('Create property success - should create new property', async () => {
      const propertyData = {
        title: 'New Property',
        description: 'A new beautiful property',
        location: 'New Location',
        pricePerNight: 150,
        category: 'house',
        amenities: ['wifi', 'pool', 'gym'],
        images: ['image1.jpg', 'image2.jpg'],
        status: 'available',
      };

      const response = await request(app)
        .post('/api/v1/host/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(propertyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property created successfully');
      expect(response.body.data).toHaveProperty('title', propertyData.title);
      expect(response.body.data).toHaveProperty('hostId', hostId);
    });

    test('Unauthorized access - should fail without token', async () => {
      const propertyData = {
        title: 'New Property',
        description: 'A new beautiful property',
        location: 'New Location',
        pricePerNight: 150,
        category: 'house',
      };

      const response = await request(app)
        .post('/api/v1/host/properties')
        .send(propertyData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/host/properties/:id - Update Property', () => {
    test('Update property success - should update existing property', async () => {
      const updateData = {
        title: 'Updated Property Title',
        pricePerNight: 200,
      };

      const response = await request(app)
        .put(`/api/v1/host/properties/${propertyId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property updated successfully');
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('pricePerNight', updateData.pricePerNight);
    });

    test('Update property not found - should fail with invalid id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        title: 'Updated Property Title',
      };

      const response = await request(app)
        .put(`/api/v1/host/properties/${fakeId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('DELETE /api/v1/host/properties/:id - Delete Property', () => {
    test('Delete property success - should delete existing property', async () => {
      const response = await request(app)
        .delete(`/api/v1/host/properties/${propertyId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property deleted successfully');

      // Verify property is deleted
      const deletedProperty = await PropertyModel.findById(propertyId);
      expect(deletedProperty).toBeNull();
    });

    test('Delete property not found - should fail with invalid id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/api/v1/host/properties/${fakeId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('GET /api/v1/properties/:id - Get Property by ID', () => {
    test('Get property by id success - should return property', async () => {
      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property retrieved successfully');
      expect(response.body.data).toHaveProperty('_id', propertyId);
      expect(response.body.data).toHaveProperty('title', 'Test Property');
    });

    test('Get property by id not found - should fail with invalid id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .get(`/api/v1/properties/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });

    test('Get property by id not available - should fail for booked property', async () => {
      // Update property to booked status
      await PropertyModel.findByIdAndUpdate(propertyId, { status: 'booked' });

      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not available');
    });
  });

  describe('GET /api/v1/properties - Get All Properties', () => {
    beforeEach(async () => {
      // Create additional properties for testing
      await PropertyModel.create([
        {
          title: 'Property 2',
          description: 'Second property',
          location: 'Location 2',
          pricePerNight: 120,
          category: 'house',
          amenities: ['wifi'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'Property 3',
          description: 'Third property',
          location: 'Location 3',
          pricePerNight: 80,
          category: 'apartment',
          amenities: ['parking'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
      ]);
    });

    test('Get all properties success - should return all available properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Properties retrieved successfully');
      expect(response.body.data).toHaveLength(3);
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('total', 3);
      }
    });
  });

  describe('GET /api/v1/properties - Search', () => {
    beforeEach(async () => {
      await PropertyModel.create([
        {
          title: 'Beach House',
          description: 'Beautiful beachfront property',
          location: 'Miami Beach',
          pricePerNight: 250,
          category: 'house',
          amenities: ['wifi', 'pool'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'Mountain Cabin',
          description: 'Cozy mountain retreat',
          location: 'Denver',
          pricePerNight: 180,
          category: 'cabin',
          amenities: ['fireplace'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
      ]);
    });

    test('Search by title - should return matching properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties?search=beach')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Beach House');
    });

    test('Search by location - should return matching properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties?search=miami')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].location).toBe('Miami Beach');
    });

    test('Search no results - should return empty array', async () => {
      const response = await request(app)
        .get('/api/v1/properties?search=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/properties - Category Filter', () => {
    beforeEach(async () => {
      // Clean up existing properties first
      await PropertyModel.deleteMany({});
      
      await PropertyModel.create([
        {
          title: 'Luxury Apartment',
          description: 'High-end apartment',
          location: 'New York',
          pricePerNight: 300,
          category: 'apartment',
          amenities: ['wifi', 'gym'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'Cozy House',
          description: 'Family house',
          location: 'Suburb',
          pricePerNight: 150,
          category: 'house',
          amenities: ['parking'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'City Apartment',
          description: 'Downtown apartment',
          location: 'Chicago',
          pricePerNight: 120,
          category: 'apartment',
          amenities: ['wifi'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
      ]);
    });

    test('Filter by category - should return only matching category', async () => {
      const response = await request(app)
        .get('/api/v1/properties?category=apartment')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((property: any) => {
        expect(property.category).toBe('apartment');
      });
    });

    test('Filter by category no results - should return empty array', async () => {
      const response = await request(app)
        .get('/api/v1/properties?category=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/properties - Sort', () => {
    beforeEach(async () => {
      await PropertyModel.create([
        {
          title: 'Expensive Property',
          description: 'Luxury stay',
          location: 'Location 1',
          pricePerNight: 500,
          category: 'house',
          amenities: ['pool'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'Cheap Property',
          description: 'Budget stay',
          location: 'Location 2',
          pricePerNight: 50,
          category: 'apartment',
          amenities: ['wifi'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
        {
          title: 'Mid Range Property',
          description: 'Mid-range stay',
          location: 'Location 3',
          pricePerNight: 200,
          category: 'house',
          amenities: ['parking'],
          images: [],
          status: 'available',
          hostId: hostId,
        },
      ]);
    });

    test('Sort by price ascending - should return properties in ascending price order', async () => {
      const response = await request(app)
        .get('/api/v1/properties?sortBy=price_asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].pricePerNight).toBeLessThan(response.body.data[1].pricePerNight);
      expect(response.body.data[1].pricePerNight).toBeLessThan(response.body.data[2].pricePerNight);
    });

    test('Sort by price descending - should return properties in descending price order', async () => {
      const response = await request(app)
        .get('/api/v1/properties?sortBy=price_desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].pricePerNight).toBeGreaterThan(response.body.data[1].pricePerNight);
      expect(response.body.data[1].pricePerNight).toBeGreaterThan(response.body.data[2].pricePerNight);
    });

    test('Sort by newest - should return properties by creation date descending', async () => {
      const response = await request(app)
        .get('/api/v1/properties?sortBy=newest')
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.map((p: any) => new Date(p.createdAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });
  });

  describe('GET /api/v1/properties - Pagination', () => {
    beforeEach(async () => {
      // Clean up existing properties first
      await PropertyModel.deleteMany({});
      
      // Create 15 properties for pagination testing
      const properties = [];
      for (let i = 1; i <= 15; i++) {
        properties.push({
          title: `Property ${i}`,
          description: `Description ${i}`,
          location: `Location ${i}`,
          pricePerNight: 100 + i,
          category: 'apartment',
          amenities: ['wifi'],
          images: [],
          status: 'available',
          hostId: hostId,
        });
      }
      await PropertyModel.create(properties);
    });

    test('Pagination with default limit - should return first 10 properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties?page=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 10);
        expect(response.body.pagination).toHaveProperty('total', 15);
        expect(response.body.pagination).toHaveProperty('totalPages', 2);
      }
    });

    test('Pagination with custom limit - should return specified number of properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.pagination).toHaveProperty('totalPages', 3);
      }
    });

    test('Pagination second page - should return next set of properties', async () => {
      const response = await request(app)
        .get('/api/v1/properties?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5); // 15 total - 10 on first page
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('page', 2);
      }
    });
  });

  describe('Unauthorized Access Tests', () => {
    test('Unauthorized access to host property creation - should fail without token', async () => {
      const propertyData = {
        title: 'New Property',
        description: 'A new beautiful property',
        location: 'New Location',
        pricePerNight: 150,
        category: 'house',
      };

      const response = await request(app)
        .post('/api/v1/host/properties')
        .send(propertyData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access to host property update - should fail without token', async () => {
      const response = await request(app)
        .put(`/api/v1/host/properties/${propertyId}`)
        .send({ title: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access to host property delete - should fail without token', async () => {
      const response = await request(app)
        .delete(`/api/v1/host/properties/${propertyId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access with invalid token - should fail', async () => {
      const response = await request(app)
        .post('/api/v1/host/properties')
        .set('Authorization', 'Bearer invalid_token')
        .send({ title: 'New Property' });

      expect([401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Non-host user access to host routes - should fail with user token', async () => {
      // Create a regular user
      const regularUser = await UserModel.create({
        firstName: 'Regular',
        lastName: 'User',
        email: 'regular@example.com',
        username: 'regularuser',
        password: 'password123',
        phoneNumber: '5555555555',
        gender: 'male',
        role: 'user',
      });

      const userToken = jwt.sign(
        { id: regularUser._id.toString(), email: regularUser.email, role: 'user' },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/v1/host/properties')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'New Property' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Forbidden not host');
    });
  });
});
