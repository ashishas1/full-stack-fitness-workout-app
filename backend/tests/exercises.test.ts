import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Exercise Endpoints', () => {
  let athleteToken = '';

  beforeAll(async () => {
    // Log in as seeded athlete
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

  describe('GET /api/exercises', () => {
    it('should return paginated list of exercises', async () => {
      const res = await request(app).get('/api/exercises?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exercises.length).toBeLessThanOrEqual(5);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter exercises by category CHEST', async () => {
      const res = await request(app).get('/api/exercises?category=CHEST');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exercises.every((e: any) => e.category === 'CHEST')).toBe(true);
    });

    it('should search exercises by name query', async () => {
      const res = await request(app).get('/api/exercises?search=bench');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exercises.some((e: any) => e.name.toLowerCase().includes('bench'))).toBe(true);
    });
  });

  describe('POST /api/exercises/:id/favorite', () => {
    it('should toggle favorite status for an exercise', async () => {
      // Find an exercise
      const exercise = await prisma.exercise.findFirst();
      expect(exercise).toBeDefined();

      const res = await request(app)
        .post(`/api/exercises/${exercise!.id}/favorite`)
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFavorited).toBeDefined();
    });
  });
});
