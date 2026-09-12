import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Dashboard & Health Endpoints', () => {
  let athleteToken = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'athlete@fitness.app',
        password: 'Athlete@12345',
      });
    athleteToken = res.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('should return system health and database status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.database).toBe('CONNECTED');
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return aggregated dashboard with stats and recent activities', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.totalWorkouts).toBeGreaterThanOrEqual(1);
    });
  });
});
