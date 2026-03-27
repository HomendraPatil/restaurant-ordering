import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('Admin Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let testOrderId = '';

  const adminUser = {
    id: 'admin-user-e2e',
    email: 'admin@test.com',
    name: 'Admin User',
    role: Role.ADMIN,
  };

  const regularUser = {
    id: 'regular-user-e2e',
    email: 'user@test.com',
    name: 'Regular User',
    role: Role.CUSTOMER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    adminToken = jwtService.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });
    userToken = jwtService.sign({ sub: regularUser.id, email: regularUser.email, role: regularUser.role });

    await prisma.user.upsert({
      where: { id: adminUser.id },
      update: {},
      create: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        passwordHash: 'hashedpassword',
        role: Role.ADMIN,
      },
    });

    const testUser = await prisma.user.upsert({
      where: { id: regularUser.id },
      update: {},
      create: {
        id: regularUser.id,
        email: regularUser.email,
        name: regularUser.name,
        passwordHash: 'hashedpassword',
        role: Role.CUSTOMER,
      },
    });

    const testAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        addressLine: '123 Test Street',
        city: 'Test City',
        pincode: '123456',
        isDefault: true,
      },
    });

    const testMenuItem = await prisma.menuItem.findFirst({
      where: { isAvailable: true },
    });

    if (testMenuItem) {
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 100,
          taxAmount: 18,
          totalAmount: 118,
          status: 'RECEIVED',
          items: {
            create: {
              menuItemId: testMenuItem.id,
              quantity: 1,
              unitPrice: 100,
              customizationPrice: 0,
            },
          },
        },
      });
      testOrderId = order.id;
    }
  });

  afterAll(async () => {
    if (testOrderId) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
      await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: regularUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    await app.close();
  });

  describe('GET /admin/orders', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .expect(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 200 for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?status=PREPARING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
    });
  });

  describe('PATCH /admin/orders/:id/status', () => {
    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/orders/test-id/status')
        .send({ status: 'PREPARING' })
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/orders/test-id/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'PREPARING' })
        .expect(403);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/orders/non-existent-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARING' })
        .expect(404);
    });

    it('should update order status for admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARING' })
        .expect(200);
      expect(response.body.status).toBe('PREPARING');
    });
  });

  describe('GET /admin/orders/:id/history', () => {
    it('should return order status history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/orders/${testOrderId}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
