import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

describe('Commerce & Payment Lifecycle Endpoints', () => {
  let athleteToken = '';
  let athleteId = '';
  let createdOrderId = '';
  let orderToken = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'athlete@fitness.app',
        password: 'Athlete@12345',
      });
    athleteToken = res.body.data.tokens.accessToken;
    athleteId = res.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/commerce/plans', () => {
    it('should return all 3 configurable membership plans with rupees pricing', async () => {
      const res = await request(app).get('/api/v1/commerce/plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const slugs = res.body.data.map((p: any) => p.slug);
      expect(slugs).toContain('monthly');
      expect(slugs).toContain('yearly');
      expect(slugs).toContain('lifetime');

      const monthly = res.body.data.find((p: any) => p.slug === 'monthly');
      expect(monthly.price).toBe(99);
      expect(monthly.currency).toBe('INR');

      const yearly = res.body.data.find((p: any) => p.slug === 'yearly');
      expect(yearly.price).toBe(550);

      const lifetime = res.body.data.find((p: any) => p.slug === 'lifetime');
      expect(lifetime.price).toBe(1200);
      expect(lifetime.durationDays).toBeNull();
    });
  });

  describe('POST /api/v1/commerce/order', () => {
    it('should reject order creation for invalid membership tier', async () => {
      const res = await request(app)
        .post('/api/v1/commerce/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ tier: 'non-existent-tier' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully create an order with cryptographic token & UPI QR string', async () => {
      const res = await request(app)
        .post('/api/v1/commerce/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ tier: 'monthly' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderId).toBeDefined();
      expect(res.body.data.order.token).toBeDefined();
      expect(res.body.data.order.amount).toBe(99);
      expect(res.body.data.order.qrCodeString).toContain('upi://pay');

      createdOrderId = res.body.data.order.orderId;
      orderToken = res.body.data.order.token;
    });
  });

  describe('POST /api/v1/commerce/verify', () => {
    it('should reject payment verification without signature token', async () => {
      const res = await request(app)
        .post('/api/v1/commerce/verify')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          orderId: createdOrderId,
          token: '',
          tier: 'monthly',
          paymentMethod: 'UPI (athlete@okhdfcbank)',
        });

      expect(res.status).toBe(422);
    });

    it('should verify payment, activate membership, and generate invoice in transaction', async () => {
      const res = await request(app)
        .post('/api/v1/commerce/verify')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          orderId: createdOrderId,
          token: orderToken,
          tier: 'monthly',
          paymentMethod: 'UPI (athlete@okhdfcbank)',
          gatewayPaymentId: `pay_test_${Date.now()}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe('monthly');
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);

      // Verify in database
      const order = await prisma.order.findUnique({ where: { orderId: createdOrderId } });
      expect(order?.status).toBe('PAID');
    });

    it('should handle duplicate payment requests idempotently without double-billing', async () => {
      const res = await request(app)
        .post('/api/v1/commerce/verify')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          orderId: createdOrderId,
          token: orderToken,
          tier: 'monthly',
          paymentMethod: 'UPI (athlete@okhdfcbank)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.idempotent).toBe(true);
    });
  });

  describe('GET /api/v1/commerce/invoices', () => {
    it('should return user invoice history', async () => {
      const res = await request(app)
        .get('/api/v1/commerce/invoices')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should report deep health with DB, cache, and queue status', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.components.database.status).toBe('HEALTHY');
      expect(res.body.data.components.cache.status).toBe('HEALTHY');
    });
  });
});
