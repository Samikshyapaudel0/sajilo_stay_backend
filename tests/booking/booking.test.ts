import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import { BookingModel } from '../../src/models/booking.model';
import { PropertyModel } from '../../src/models/property.model';
import { UserModel } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../../src/configs/constant';

describe('Booking Module Tests', () => {
  let userToken: string;
  let hostToken: string;
  let adminToken: string;
  let userId: string;
  let hostId: string;
  let adminId: string;
  let propertyId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sajilo_test';
    await mongoose.connect(mongoUri);
    // Clean up database before running tests
    await BookingModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up database
    await BookingModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await BookingModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create a regular user
    const user = await UserModel.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      phoneNumber: '1234567890',
      gender: 'male',
      role: 'user',
    });
    userId = user._id.toString();
    userToken = jwt.sign(
      { id: userId, email: user.email, role: 'user' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Create a host user
    const host = await UserModel.create({
      firstName: 'Host',
      lastName: 'User',
      email: 'host@example.com',
      username: 'hostuser',
      password: 'password123',
      phoneNumber: '0987654321',
      gender: 'female',
      role: 'host',
    });
    hostId = host._id.toString();
    hostToken = jwt.sign(
      { id: hostId, email: host.email, role: 'host' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Create an admin user
    const admin = await UserModel.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'password123',
      phoneNumber: '5555555555',
      gender: 'male',
      role: 'admin',
    });
    adminId = admin._id.toString();
    adminToken = jwt.sign(
      { id: adminId, email: admin.email, role: 'admin' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Create a test property
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

    // Create a test booking
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 10);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3);

    const booking = await BookingModel.create({
      userId: userId,
      propertyId: propertyId,
      hostId: hostId,
      checkInDate,
      checkOutDate,
      guests: 2,
      totalPrice: 300,
      status: 'pending',
    });
    bookingId = booking._id.toString();
  });

  describe('POST /api/v1/bookings - Create Booking', () => {
    test('Create booking success - should create new booking', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 20);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const bookingData = {
        propertyId: propertyId,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        guests: 2,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking request created successfully');
      expect(response.body.data).toHaveProperty('propertyId', propertyId);
      expect(response.body.data).toHaveProperty('userId', userId);
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('totalPrice', 200); // 2 nights * 100
    });

    test('Booking validation - should fail with invalid dates', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 20);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() - 1); // Before check-in

      const bookingData = {
        propertyId: propertyId,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        guests: 2,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Booking validation - should fail with invalid guests', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 20);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const bookingData = {
        propertyId: propertyId,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        guests: 0, // Invalid
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Booking validation - should fail with missing propertyId', async () => {
      const bookingData = {
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date().toISOString(),
        guests: 2,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/bookings/:id - Get Booking', () => {
    test('Get booking by id success - should return booking', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking retrieved successfully');
      expect(response.body.data).toHaveProperty('_id', bookingId);
      expect(response.body.data).toHaveProperty('property');
    });

    test('Invalid booking id - should fail with non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .get(`/api/v1/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Booking not found');
    });

    test('Get booking not owned - should fail for different user', async () => {
      // Create another user
      const otherUser = await UserModel.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123',
        phoneNumber: '1111111111',
        gender: 'male',
        role: 'user',
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email, role: 'user' },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Forbidden - Booking does not belong to this user');
    });
  });

  describe('GET /api/v1/bookings - Get User Bookings', () => {
    beforeEach(async () => {
      // Create additional bookings for the user
      const checkInDate1 = new Date();
      checkInDate1.setDate(checkInDate1.getDate() + 30);
      const checkOutDate1 = new Date(checkInDate1);
      checkOutDate1.setDate(checkOutDate1.getDate() + 2);

      await BookingModel.create({
        userId: userId,
        propertyId: propertyId,
        hostId: hostId,
        checkInDate: checkInDate1,
        checkOutDate: checkOutDate1,
        guests: 1,
        totalPrice: 200,
        status: 'confirmed',
      });

      const checkInDate2 = new Date();
      checkInDate2.setDate(checkInDate2.getDate() + 40);
      const checkOutDate2 = new Date(checkInDate2);
      checkOutDate2.setDate(checkOutDate2.getDate() + 1);

      await BookingModel.create({
        userId: userId,
        propertyId: propertyId,
        hostId: hostId,
        checkInDate: checkInDate2,
        checkOutDate: checkOutDate2,
        guests: 3,
        totalPrice: 100,
        status: 'cancelled',
      });
    });

    test('Get user bookings success - should return all user bookings', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bookings retrieved successfully');
      expect(response.body.data).toHaveLength(3);
    });

    test('Get user bookings with pagination - should respect pagination', async () => {
      const response = await request(app)
        .get('/api/v1/bookings?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 2);
      }
    });
  });

  describe('GET /api/v1/host/bookings - Host Bookings', () => {
    test('Get host bookings success - should return all host bookings', async () => {
      const response = await request(app)
        .get('/api/v1/host/bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bookings retrieved successfully');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('hostId', hostId);
    });

    test('Unauthorized access to host bookings - should fail for regular user', async () => {
      const response = await request(app)
        .get('/api/v1/host/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Forbidden not host');
    });
  });

  describe('PUT /api/v1/bookings/:id/cancel - Cancel Booking', () => {
    test('Cancel booking success - should cancel pending booking', async () => {
      const response = await request(app)
        .put(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking cancelled successfully');
      expect(response.body.data).toHaveProperty('status', 'cancelled');

      // Verify in database
      const cancelledBooking = await BookingModel.findById(bookingId);
      expect(cancelledBooking?.status).toBe('cancelled');
    });

    test('Cancel booking not pending - should fail for confirmed booking', async () => {
      // Update booking to confirmed
      await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed' });

      const response = await request(app)
        .put(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only pending bookings can be cancelled');
    });

    test('Cancel booking not owned - should fail for different user', async () => {
      const otherUser = await UserModel.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other2@example.com',
        username: 'otheruser2',
        password: 'password123',
        phoneNumber: '2222222222',
        gender: 'male',
        role: 'user',
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString(), email: otherUser.email, role: 'user' },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/host/bookings/:id/confirm - Confirm Booking', () => {
    test('Confirm booking success - should confirm pending booking', async () => {
      const response = await request(app)
        .put(`/api/v1/host/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking confirmed successfully');
      expect(response.body.data).toHaveProperty('status', 'confirmed');
    });

    test('Confirm booking not pending - should fail for cancelled booking', async () => {
      await BookingModel.findByIdAndUpdate(bookingId, { status: 'cancelled' });

      const response = await request(app)
        .put(`/api/v1/host/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only pending bookings can be confirmed');
    });
  });

  describe('PUT /api/v1/host/bookings/:id/reject - Reject Booking', () => {
    test('Reject booking success - should reject pending booking', async () => {
      const response = await request(app)
        .put(`/api/v1/host/bookings/${bookingId}/reject`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking rejected successfully');
      expect(response.body.data).toHaveProperty('status', 'rejected');
    });
  });

  describe('PUT /api/v1/admin/bookings/:id/status - Booking Status Update', () => {
    test('Update booking status success - should update status', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking status updated successfully');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    test('Update booking status with invalid status - should fail', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access to admin booking status - should fail for regular user', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'completed' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Forbidden not admin');
    });
  });

  describe('Unauthorized Access Tests', () => {
    test('Unauthorized access to create booking - should fail without token', async () => {
      const bookingData = {
        propertyId: propertyId,
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date().toISOString(),
        guests: 2,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(bookingData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access to get bookings - should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access to cancel booking - should fail without token', async () => {
      const response = await request(app)
        .put(`/api/v1/bookings/${bookingId}/cancel`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Unauthorized access with invalid token - should fail', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer invalid_token')
        .send({ propertyId: propertyId, checkInDate: new Date().toISOString(), checkOutDate: new Date().toISOString(), guests: 2 });

      expect([401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});
