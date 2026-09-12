import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Auth Endpoints', () => {
  const testEmail = `test_${Date.now()}@fitness.app`;
  const testPassword = 'Password@123';
  let accessToken = '';
  let refreshToken = '';

  afterAll(async () => {
    // Cleanup created test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid email or short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          name: 'T',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Runner',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should prevent duplicate registration with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Duplicate User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully log in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return current user when authenticated with Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should issue new access & refresh tokens on valid refresh', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });
});
