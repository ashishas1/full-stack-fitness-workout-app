import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Workout & Tracking Endpoints', () => {
  let athleteToken = '';
  let athleteId = '';
  let templateId = '';
  let sessionId = '';
  let sessionExerciseId = '';
  let testExerciseId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'athlete@fitness.app',
        password: 'Athlete@12345',
      });
    athleteToken = res.body.data.tokens.accessToken;
    athleteId = res.body.data.user.id;

    const ex = await prisma.exercise.findFirst({ where: { slug: 'barbell-bench-press' } });
    testExerciseId = ex!.id;

    // Reset PRs for test isolation
    await prisma.personalRecord.deleteMany({
      where: { userId: athleteId, exerciseId: testExerciseId },
    });
  });

  afterAll(async () => {
    // Cleanup created templates, sessions, and test PRs
    await prisma.personalRecord.deleteMany({
      where: { userId: athleteId, exerciseId: testExerciseId },
    });
    if (templateId) {
      await prisma.workoutTemplate.deleteMany({ where: { id: templateId } });
    }
    if (sessionId) {
      await prisma.workoutSession.deleteMany({ where: { id: sessionId } });
    }
    await prisma.$disconnect();
  });

  describe('Workout Templates', () => {
    it('should create a custom workout template', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          name: 'Personal Chest Day Test',
          description: 'High volume chest focus',
          estimatedDuration: 50,
          isPublic: false,
          exercises: [
            {
              exerciseId: testExerciseId,
              orderIndex: 0,
              targetSets: 4,
              targetReps: '10',
              restSeconds: 90,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Personal Chest Day Test');
      expect(res.body.data.exercises.length).toBe(1);

      templateId = res.body.data.id;
    });

    it('should retrieve user templates', async () => {
      const res = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.templates.some((t: any) => t.id === templateId)).toBe(true);
    });
  });

  describe('Session Lifecycle & PR Detection', () => {
    it('should start a workout session from template', async () => {
      // First ensure no active sessions exist for athlete
      await prisma.workoutSession.updateMany({
        where: { userId: athleteId, status: 'IN_PROGRESS' },
        data: { status: 'ABANDONED' },
      });

      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          templateId,
          name: 'Live Chest Workout',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.exercises.length).toBeGreaterThan(0);

      sessionId = res.body.data.id;
      sessionExerciseId = res.body.data.exercises[0].id;
    });

    it('should log a completed set with weight and reps', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          exerciseId: testExerciseId,
          setNumber: 1,
          weightKg: 105, // heavy set to test PR
          reps: 5,
          isWarmup: false,
          isCompleted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weightKg).toBe(105);
      expect(res.body.data.reps).toBe(5);
    });

    it('should complete the session, calculate volume & calories, and record PRs', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          durationSeconds: 2400,
          notes: 'Great session, set a new record!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.status).toBe('COMPLETED');
      expect(res.body.data.summary.totalVolumeKg).toBeGreaterThanOrEqual(525); // 105 * 5
      expect(res.body.data.summary.estimatedCalories).toBeGreaterThan(0);
      expect(res.body.data.summary.newPRs.length).toBeGreaterThan(0);
    });
  });
});
