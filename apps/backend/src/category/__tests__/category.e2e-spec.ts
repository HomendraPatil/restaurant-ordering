import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as request from 'supertest';
import { randomUUID } from 'crypto';

describe('Category (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testCategoryIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.category.deleteMany({ where: { name: { contains: 'Test Category' } } });

    for (let i = 1; i <= 3; i++) {
      const category = await prisma.category.create({
        data: {
          name: `Test Category ${i}`,
          slug: `test-category-${i}-${Date.now()}`,
          description: `Test description ${i}`,
          sortOrder: i,
          isActive: true,
        },
      });
      testCategoryIds.push(category.id);
    }
  });

  afterAll(async () => {
    const testUsers = await prisma.user.findMany({ where: { email: { contains: 'test' } } });
    const testUserIds = testUsers.map(u => u.id);
    
    await prisma.orderItem.deleteMany({ where: { order: { userId: { in: testUserIds } } } });
    await prisma.order.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.cartItem.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.address.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    await prisma.category.deleteMany({ where: { id: { in: testCategoryIds } } });
    await app.close();
  });

  describe('/api/v1/categories (GET)', () => {
    it('should return all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return paginated categories when pagination params provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.items.length).toBeLessThanOrEqual(2);
    });

    it('should include menuItems count', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      const testCategory = response.body.find((c: { id: string }) => testCategoryIds.includes(c.id));
      expect(testCategory).toHaveProperty('_count');
      expect(testCategory._count).toHaveProperty('menuItems');
    });
  });

  describe('/api/v1/categories/:id (GET)', () => {
    it('should return a single category by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/${testCategoryIds[0]}`)
        .expect(200);

      expect(response.body.id).toBe(testCategoryIds[0]);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/categories/${randomUUID()}`)
        .expect(404);
    });
  });

  describe('/api/v1/categories/slug/:slug (GET)', () => {
    it('should return a single category by slug', async () => {
      const category = await prisma.category.findFirst({ where: { id: testCategoryIds[0] } });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/slug/${category?.slug}`)
        .expect(200);

      expect(response.body.slug).toBe(category?.slug);
    });

    it('should include menu items', async () => {
      const category = await prisma.category.findFirst({ where: { id: testCategoryIds[0] } });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/slug/${category?.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('menuItems');
      expect(Array.isArray(response.body.menuItems)).toBe(true);
    });
  });

  describe('/api/v1/categories (POST) - Admin only', () => {
    it('should create a new category with admin auth', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `admin-test-${Date.now()}@test.com`,
          passwordHash: '$2b$12$testhash',
          name: 'Test Admin',
          role: Role.ADMIN,
        },
      });

      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });

      const createDto = {
        name: 'New Test Category',
        slug: `new-test-category-${Date.now()}`,
        description: 'A delicious new category',
        sortOrder: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe(createDto.name);
      expect(response.body.slug).toBe(createDto.slug);

      await prisma.category.delete({ where: { id: response.body.id } });
      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    });

    it('should reject creation without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should reject creation without admin role', async () => {
      const regularUser = await prisma.user.create({
        data: {
          email: `user-test-${Date.now()}@test.com`,
          passwordHash: '$2b$12$testhash',
          name: 'Test User',
          role: Role.CUSTOMER,
        },
      });

      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: regularUser.id, email: regularUser.email, role: regularUser.role });

      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' })
        .expect(403);

      await prisma.user.delete({ where: { id: regularUser.id } }).catch(() => {});
    });
  });

  describe('/api/v1/categories (PATCH) - Admin only', () => {
    let categoryToUpdate: string;

    beforeAll(async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Category To Update',
          slug: `update-test-${Date.now()}`,
          description: 'Original description',
        },
      });
      categoryToUpdate = category.id;
    });

    afterAll(async () => {
      await prisma.category.delete({ where: { id: categoryToUpdate } });
    });

    it('should update a category with admin auth', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `admin-update-test-${Date.now()}@test.com`,
          passwordHash: '$2b$12$testhash',
          name: 'Test Admin',
          role: Role.ADMIN,
        },
      });

      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });

      const updateDto = {
        name: 'Updated Category Name',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryToUpdate}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);

      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    });

    it('should return 404 when updating non-existent category', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `admin-update-test-404-${Date.now()}@test.com`,
          passwordHash: '$2b$12$testhash',
          name: 'Test Admin',
          role: Role.ADMIN,
        },
      });

      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });

      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${randomUUID()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' })
        .expect(404);

      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    });
  });

  describe('/api/v1/categories (DELETE) - Admin only', () => {
    let categoryToDelete: string;

    beforeAll(async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Category To Delete',
          slug: `delete-test-${Date.now()}`,
        },
      });
      categoryToDelete = category.id;
    });

    it('should soft delete a category with admin auth', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `admin-delete-test-${Date.now()}@test.com`,
          passwordHash: '$2b$12$testhash',
          name: 'Test Admin',
          role: Role.ADMIN,
        },
      });

      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryToDelete}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await prisma.category.findUnique({ where: { id: categoryToDelete } });
      expect(deleted?.deletedAt).toBeTruthy();

      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    });
  });
});
