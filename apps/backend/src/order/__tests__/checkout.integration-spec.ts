import * as request from 'supertest';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

describe('Checkout Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  // Helper to login and get token
  const login = async () => {
    const response = await request(API_BASE.replace('/api/v1', ''))
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@restaurant.com',
        password: 'admin123',
      })
      .expect(200);

    authToken = response.body.accessToken;
    testUserId = response.body.user.id;
    return { token: authToken, userId: testUserId };
  };

  describe('POST /api/v1/orders', () => {
    it('should require authentication', async () => {
      await request(API_BASE.replace('/api/v1', ''))
        .post('/api/v1/orders')
        .send({
          addressId: 'some-address',
          items: [],
        })
        .expect(401);
    });

    it('should validate request body', async () => {
      await login();

      await request(API_BASE.replace('/api/v1', ''))
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty items array', async () => {
      await login();

      await request(API_BASE.replace('/api/v1', ''))
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          addressId: 'some-address',
          items: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/user/addresses', () => {
    it('should require authentication', async () => {
      await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/user/addresses')
        .expect(401);
    });

    it('should return user addresses when authenticated', async () => {
      const { token } = await login();

      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/user/addresses', () => {
    it('should create a new address', async () => {
      const { token } = await login();

      const response = await request(API_BASE.replace('/api/v1', ''))
        .post('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          addressLine: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          pincode: '123456',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.addressLine).toBe('123 Test Street');
      expect(response.body.city).toBe('Test City');
    });

    it('should validate required fields', async () => {
      const { token } = await login();

      await request(API_BASE.replace('/api/v1', ''))
        .post('/api/v1/user/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          city: 'Test City',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/orders/my-orders', () => {
    it('should require authentication', async () => {
      await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/orders/my-orders')
        .expect(401);
    });

    it('should return user orders when authenticated', async () => {
      const { token } = await login();

      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});