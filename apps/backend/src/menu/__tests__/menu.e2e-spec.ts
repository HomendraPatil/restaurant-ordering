import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import * as request from 'supertest';

describe('Menu (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testCategoryId: string;

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
    await prisma.category.deleteMany({ where: { name: { contains: 'Test' } } });

    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: '$2b$12$testhash',
        name: 'Test Admin',
        role: Role.ADMIN,
      },
    });

    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
        description: 'Test description',
      },
    });
    testCategoryId = category.id;

    await prisma.menuItem.deleteMany({ where: { name: { contains: 'Test' } } });
    for (let i = 1; i <= 5; i++) {
      await prisma.menuItem.create({
        data: {
          name: `Test Item ${i}`,
          slug: `test-item-${i}-${Date.now()}`,
          description: `Test description ${i}`,
          price: new Prisma.Decimal(100 + i * 10),
          categoryId: testCategoryId,
          isAvailable: true,
          isVegetarian: i % 2 === 0,
          isVegan: false,
          isGlutenFree: i === 1,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.menuItem.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.category.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await app.close();
  });

  describe('/api/v1/menu (GET)', () => {
    it('should return paginated menu items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/menu?categoryId=${testCategoryId}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      response.body.items.forEach((item: { categoryId: string }) => {
        expect(item.categoryId).toBe(testCategoryId);
      });
    });

    it('should filter by isVegetarian', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu?isVegetarian=true')
        .expect(200);

      response.body.items.forEach((item: { isVegetarian: boolean }) => {
        expect(item.isVegetarian).toBe(true);
      });
    });

    it('should filter by isGlutenFree', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu?isGlutenFree=true')
        .expect(200);

      response.body.items.forEach((item: { isGlutenFree: boolean }) => {
        expect(item.isGlutenFree).toBe(true);
      });
    });

    it('should search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu?search=Test Item 1')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu?page=1&limit=2')
        .expect(200);

      expect(response.body.items.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });
  });

  describe('/api/v1/menu/:id (GET)', () => {
    it('should return a single menu item by id', async () => {
      const item = await prisma.menuItem.findFirst({ where: { name: { contains: 'Test Item 1' } } });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/menu/${item?.id}`)
        .expect(200);

      expect(response.body.id).toBe(item?.id);
      expect(response.body.name).toBe('Test Item 1');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/menu/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/v1/menu/slug/:slug (GET)', () => {
    it('should return a single menu item by slug', async () => {
      const item = await prisma.menuItem.findFirst({ where: { name: 'Test Item 1' } });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/menu/slug/${item?.slug}`)
        .expect(200);

      expect(response.body.slug).toBe(item?.slug);
    });
  });

  describe('/api/v1/menu (POST) - Admin only', () => {
    it('should create a new menu item with admin auth', async () => {
      const adminUser = await prisma.user.findFirst({ where: { email: 'admin@test.com' } });
      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: adminUser?.id, email: adminUser?.email, role: adminUser?.role });

      const createDto = {
        name: 'New Test Item',
        slug: `new-test-item-${Date.now()}`,
        description: 'A delicious new item',
        price: 199,
        categoryId: testCategoryId,
        isAvailable: true,
        isVegetarian: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${token}`)
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe(createDto.name);
      expect(response.body.slug).toBe(createDto.slug);

      await prisma.menuItem.delete({ where: { id: response.body.id } });
    });

    it('should reject creation without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/menu')
        .send({ name: 'Test' })
        .expect(401);
    });
  });
});
