import * as request from 'supertest';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const BASE_URL = API_BASE.replace('/api/v1', '');

describe('Menu Integration Tests', () => {
  let adminToken: string;
  let testMenuItemId: string;
  let testGroupId: string;
  let testOptionId: string;

  beforeAll(async () => {
    const loginResponse = await request(BASE_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@restaurant.com', password: 'admin123' })
      .expect(200);

    adminToken = loginResponse.body.accessToken;

    const menuResponse = await request(BASE_URL)
      .get('/api/v1/menu/admin/all?limit=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    if (menuResponse.body.items.length > 0) {
      testMenuItemId = menuResponse.body.items[0].id;
    } else {
      const categoryResponse = await request(BASE_URL)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const categoryId = categoryResponse.body[0]?.id;
      
      const newItemResponse = await request(BASE_URL)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Pizza',
          slug: 'test-pizza-integration',
          price: 299,
          categoryId: categoryId,
          isAvailable: true,
        })
        .expect(201);

      testMenuItemId = newItemResponse.body.id;
    }
  });

  afterAll(async () => {
    if (testOptionId) {
      await request(BASE_URL)
        .delete(`/api/v1/menu/customization-options/${testOptionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    if (testGroupId) {
      await request(BASE_URL)
        .delete(`/api/v1/menu/customization-groups/${testGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  describe('GET /api/v1/menu', () => {
    it('should return paginated menu items', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/menu')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/menu?page=1&limit=5')
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.page).toBe(1);
    });

    it('should filter by categoryId', async () => {
      const categoriesResponse = await request(BASE_URL)
        .get('/api/v1/categories')
        .expect(200);

      if (categoriesResponse.body.length > 0) {
        const categoryId = categoriesResponse.body[0].id;
        const response = await request(BASE_URL)
          .get(`/api/v1/menu?categoryId=${categoryId}`)
          .expect(200);

        response.body.items.forEach((item: { categoryId: string }) => {
          expect(item.categoryId).toBe(categoryId);
        });
      }
    });

    it('should filter by isVegetarian', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/menu?isVegetarian=true')
        .expect(200);

      response.body.items.forEach((item: { isVegetarian: boolean }) => {
        expect(item.isVegetarian).toBe(true);
      });
    });
  });

  describe('GET /api/v1/menu/:id', () => {
    it('should return a single menu item', async () => {
      const listResponse = await request(BASE_URL)
        .get('/api/v1/menu?limit=1')
        .expect(200);

      if (listResponse.body.items.length > 0) {
        const itemId = listResponse.body.items[0].id;
        const response = await request(BASE_URL)
          .get(`/api/v1/menu/${itemId}`)
          .expect(200);

        expect(response.body.id).toBe(itemId);
      }
    });

    it('should return 404 for non-existent id', async () => {
      await request(BASE_URL)
        .get('/api/v1/menu/non-existent-id-12345')
        .expect(404);
    });
  });

  describe('GET /api/v1/menu/slug/:slug', () => {
    it('should return a menu item by slug', async () => {
      const listResponse = await request(BASE_URL)
        .get('/api/v1/menu?limit=1')
        .expect(200);

      if (listResponse.body.items.length > 0) {
        const slug = listResponse.body.items[0].slug;
        const response = await request(BASE_URL)
          .get(`/api/v1/menu/slug/${slug}`)
          .expect(200);

        expect(response.body.slug).toBe(slug);
      }
    });
  });

  describe('GET /api/v1/menu/admin/all', () => {
    it('should return all menu items for admin including unavailable', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/menu/admin/all?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(BASE_URL)
        .get('/api/v1/menu/admin/all')
        .expect(401);
    });
  });

  describe('Customization Group CRUD', () => {
    it('should create a customization group', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/menu/${testMenuItemId}/customization-groups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Size',
          type: 'SINGLE',
          isRequired: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Size');
      expect(response.body.type).toBe('SINGLE');
      testGroupId = response.body.id;
    });

    it('should update a customization group', async () => {
      const createResponse = await request(BASE_URL)
        .post(`/api/v1/menu/${testMenuItemId}/customization-groups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temp Group',
          type: 'MULTIPLE',
        })
        .expect(201);

      const groupId = createResponse.body.id;

      const updateResponse = await request(BASE_URL)
        .patch(`/api/v1/menu/customization-groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Group',
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Group');

      await request(BASE_URL)
        .delete(`/api/v1/menu/customization-groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should delete a customization group', async () => {
      const createResponse = await request(BASE_URL)
        .post(`/api/v1/menu/${testMenuItemId}/customization-groups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete Test Group',
          type: 'SINGLE',
        })
        .expect(201);

      const groupId = createResponse.body.id;

      const deleteResponse = await request(BASE_URL)
        .delete(`/api/v1/menu/customization-groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('id');
    });

    it('should return 404 for non-existent group', async () => {
      await request(BASE_URL)
        .patch('/api/v1/menu/customization-groups/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('Customization Option CRUD', () => {
    beforeAll(async () => {
      const groupResponse = await request(BASE_URL)
        .post(`/api/v1/menu/${testMenuItemId}/customization-groups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Size',
          type: 'SINGLE',
        })
        .expect(201);

      testGroupId = groupResponse.body.id;
    });

    it('should create a customization option', async () => {
      const response = await request(BASE_URL)
        .post(`/api/v1/menu/customization-groups/${testGroupId}/options`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Large',
          priceModifier: 50,
          isDefault: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Large');
      expect(Number(response.body.priceModifier)).toBe(50);
      testOptionId = response.body.id;
    });

    it('should update a customization option', async () => {
      const createResponse = await request(BASE_URL)
        .post(`/api/v1/menu/customization-groups/${testGroupId}/options`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temp Option',
          priceModifier: 0,
        })
        .expect(201);

      const optionId = createResponse.body.id;

      const updateResponse = await request(BASE_URL)
        .patch(`/api/v1/menu/customization-options/${optionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Option',
          priceModifier: 100,
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Option');
      expect(Number(updateResponse.body.priceModifier)).toBe(100);

      await request(BASE_URL)
        .delete(`/api/v1/menu/customization-options/${optionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should delete a customization option', async () => {
      const createResponse = await request(BASE_URL)
        .post(`/api/v1/menu/customization-groups/${testGroupId}/options`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete Test Option',
          priceModifier: 0,
        })
        .expect(201);

      const optionId = createResponse.body.id;

      const deleteResponse = await request(BASE_URL)
        .delete(`/api/v1/menu/customization-options/${optionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('id');
    });

    it('should return 404 for non-existent option', async () => {
      await request(BASE_URL)
        .patch('/api/v1/menu/customization-options/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });
});
