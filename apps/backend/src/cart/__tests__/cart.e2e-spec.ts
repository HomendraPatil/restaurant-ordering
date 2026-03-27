import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import * as request from 'supertest';

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testUserId: string;
  let testMenuItemId: string;
  let testSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Aggressive cleanup - delete any existing test data first
    const existingUser = await prisma.user.findFirst({ where: { email: 'cart-test-user@test.com' } });
    if (existingUser) {
      await prisma.orderItem.deleteMany({ where: { order: { userId: existingUser.id } } }).catch(() => {});
      await prisma.order.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.cartItem.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.address.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.session.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: existingUser.id } }).catch(() => {});
    }

    await prisma.user.deleteMany({ where: { email: { contains: 'cart-test' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'test-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'totals-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'add-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'merge-session' } } }).catch(() => {});
    await prisma.menuItem.deleteMany({ where: { name: { contains: 'Cart Test Item' } } }).catch(() => {});

    const user = await prisma.user.create({
      data: {
        email: 'cart-test-user@test.com',
        passwordHash: '$2b$12$testhash',
        name: 'Cart Test User',
        role: 'CUSTOMER',
      },
    });
    testUserId = user.id;
    await prisma.cartItem.deleteMany({ where: { userId: testUserId } }).catch(() => {});

    const category = await prisma.category.findFirst();
    
    const menuItem = await prisma.menuItem.create({
      data: {
        name: 'Cart Test Item',
        slug: `cart-test-item-${Date.now()}`,
        description: 'A test item for cart',
        price: 10.99,
        categoryId: category!.id,
        isAvailable: true,
      },
    });
    testMenuItemId = menuItem.id;

    testSessionId = `test-session-${Date.now()}`;
  });

  afterAll(async () => {
    const testUsers = await prisma.user.findMany({ where: { email: { contains: 'cart-test' } } });
    const testUserIds = testUsers.map(u => u.id);
    
    await prisma.orderItem.deleteMany({ where: { order: { userId: { in: testUserIds } } } }).catch(() => {});
    await prisma.order.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
    await prisma.address.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } }).catch(() => {});
    
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'test-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'totals-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'add-session' } } }).catch(() => {});
    await prisma.cartItem.deleteMany({ where: { sessionId: { contains: 'merge-session' } } }).catch(() => {});
    await prisma.menuItem.deleteMany({ where: { name: { contains: 'Cart Test Item' } } }).catch(() => {});
    await app.close();
  });

  describe('/api/v1/cart (GET)', () => {
    it('should return empty cart for new session', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('x-session-id', `new-session-${Date.now()}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBe(0);
    });

    it('should return cart with items for authenticated user', async () => {
      await prisma.cartItem.deleteMany({ where: { userId: testUserId } }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));

      await prisma.cartItem.create({
        data: {
          userId: testUserId,
          menuItemId: testMenuItemId,
          quantity: 2,
          unitPrice: 10.99,
          customizationPrice: 0,
        },
      });

      const token = jwtService.sign({ sub: testUserId, email: 'cart-test-user@test.com', role: 'CUSTOMER' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      const testItem = response.body.items.find((i: any) => i.menuItem.id === testMenuItemId && i.quantity === 2);
      expect(testItem).toBeTruthy();
    });

    it('should return cart with items for session', async () => {
      await prisma.cartItem.create({
        data: {
          sessionId: testSessionId,
          menuItemId: testMenuItemId,
          quantity: 1,
          unitPrice: 10.99,
          customizationPrice: 0,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('x-session-id', testSessionId)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].menuItem.id).toBe(testMenuItemId);
    });

    it('should calculate cart totals correctly', async () => {
      const sessionId = `totals-session-${Date.now()}`;
      
      await prisma.cartItem.create({
        data: {
          sessionId,
          menuItemId: testMenuItemId,
          quantity: 2,
          unitPrice: 10.99,
          customizationPrice: 1.50,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('x-session-id', sessionId)
        .expect(200);

      const expectedSubtotal = 10.99 * 2 + 1.50 * 2;
      const expectedTax = expectedSubtotal * 0.18;
      const expectedTotal = expectedSubtotal + expectedTax;

      expect(response.body.subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(response.body.taxAmount).toBeCloseTo(expectedTax, 2);
      expect(response.body.total).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('/api/v1/cart/items (POST)', () => {
    it('should add item to cart for guest', async () => {
      const sessionId = `add-session-${Date.now()}`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('x-session-id', sessionId)
        .send({
          menuItemId: testMenuItemId,
          quantity: 1,
          unitPrice: 10.99,
        })
        .expect(201);

      expect(response.body.menuItem.id).toBe(testMenuItemId);
      expect(response.body.quantity).toBe(1);

      await prisma.cartItem.deleteMany({ where: { sessionId } });
    });

    it('should add item to cart for authenticated user', async () => {
      // Aggressive cleanup - delete ALL cart items for this user first
      await prisma.cartItem.deleteMany({ where: { userId: testUserId } });
      // Also delete any session-based cart items with this menu item
      const sessionPattern = `test-session|add-session|totals-session|merge-session`;
      await prisma.cartItem.deleteMany({ 
        where: { 
          menuItemId: testMenuItemId,
          sessionId: { not: null }
        }
      });
      
      const token = jwtService.sign({ sub: testUserId, email: 'cart-test-user@test.com', role: 'CUSTOMER' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          menuItemId: testMenuItemId,
          quantity: 2,
          unitPrice: 10.99,
          specialInstructions: 'Extra spicy',
        })
        .expect(201);

      expect(response.body.menuItem.id).toBe(testMenuItemId);
      expect(response.body.quantity).toBe(2);
      expect(response.body.specialInstructions).toBe('Extra spicy');

      await prisma.cartItem.deleteMany({ where: { userId: testUserId } });
    });
  });

  describe('/api/v1/cart/items/:id (PATCH)', () => {
    it('should update cart item quantity', async () => {
      const cartItem = await prisma.cartItem.create({
        data: {
          sessionId: testSessionId,
          menuItemId: testMenuItemId,
          quantity: 1,
          unitPrice: 10.99,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${cartItem.id}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.quantity).toBe(3);
    });
  });

  describe('/api/v1/cart/items/:id (DELETE)', () => {
    it('should remove item from cart', async () => {
      const cartItem = await prisma.cartItem.create({
        data: {
          sessionId: testSessionId,
          menuItemId: testMenuItemId,
          quantity: 1,
          unitPrice: 10.99,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${cartItem.id}`)
        .expect(200);

      const deleted = await prisma.cartItem.findUnique({ where: { id: cartItem.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('/api/v1/cart/merge (POST)', () => {
    it('should merge guest cart into user cart on login', async () => {
      // Clean up user's existing cart first to ensure fresh state
      await prisma.cartItem.deleteMany({ where: { userId: testUserId } }).catch(() => {});
      
      const sessionId = `merge-session-${Date.now()}`;
      
      await prisma.cartItem.create({
        data: {
          sessionId,
          menuItemId: testMenuItemId,
          quantity: 2,
          unitPrice: 10.99,
        },
      });

      const token = jwtService.sign({ sub: testUserId, email: 'cart-test-user@test.com', role: 'CUSTOMER' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${token}`)
        .set('x-session-id', sessionId)
        .send({})
        .expect(201);

      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].quantity).toBe(2);

      await prisma.cartItem.deleteMany({ where: { userId: testUserId } });
    });
  });
});
