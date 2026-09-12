import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Admin & RBAC Authorization', () => {
  let athleteToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Athlete Login
    const athleteRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'athlete@fitness.app',
        password: 'Athlete@12345',
      });
    athleteToken = athleteRes.body.data.tokens.accessToken;

    // Admin Login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@fitness.app',
        password: 'Admin@12345',
      });
    adminToken = adminRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('RBAC Verification', () => {
    it('should deny non-admin user access to admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin user to access platform stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();
      expect(res.body.data.overview.totalUsers).toBeGreaterThanOrEqual(2);
    });

    it('should allow admin user to list users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });
  });
});
