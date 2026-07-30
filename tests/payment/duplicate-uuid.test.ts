import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import { BookingModel } from '../../src/models/booking.model';
import { PropertyModel } from '../../src/models/property.model';
import { UserModel } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../../src/configs/constant';

describe('Payment Duplicate UUID Test', () => {
  let userToken: string;
  let userId: string;
  let hostId: string;
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

  test('should generate different transaction_uuids for each /payments/initiate call', async () => {
    const paymentData = {
      bookingId: bookingId,
      amount: 300,
      return_url: 'http://localhost:3000/payment/callback',
      website_url: 'http://localhost:3000',
      purchase_order_id: 'order_123',
      purchase_order_name: 'Test Booking'
    };

    // First request
    const response1 = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send(paymentData)
      .expect(201);

    expect(response1.body.success).toBe(true);
    const uuid1 = response1.body.data.formData?.transaction_uuid || response1.body.data.pidx;
    expect(uuid1).toBeDefined();
    console.log('First transaction_uuid:', uuid1);

    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request with same data
    const response2 = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send(paymentData)
      .expect(201);

    expect(response2.body.success).toBe(true);
    const uuid2 = response2.body.data.formData?.transaction_uuid || response2.body.pidx;
    expect(uuid2).toBeDefined();
    console.log('Second transaction_uuid:', uuid2);

    // Verify they are different
    expect(uuid1).not.toBe(uuid2);
    console.log('✓ Transaction UUIDs are different - duplicate UUID issue is fixed!');
  });
});
