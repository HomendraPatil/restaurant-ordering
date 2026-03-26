import * as request from 'supertest';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

describe('Menu Integration Tests', () => {
  describe('GET /api/v1/menu', () => {
    it('should return paginated menu items', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu?page=1&limit=5')
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.page).toBe(1);
    });

    it('should filter by categoryId', async () => {
      const categoriesResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect(200);

      if (categoriesResponse.body.length > 0) {
        const categoryId = categoriesResponse.body[0].id;
        const response = await request(API_BASE.replace('/api/v1', ''))
          .get(`/api/v1/menu?categoryId=${categoryId}`)
          .expect(200);

        response.body.items.forEach((item: { categoryId: string }) => {
          expect(item.categoryId).toBe(categoryId);
        });
      }
    });

    it('should filter by isVegetarian', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu?isVegetarian=true')
        .expect(200);

      response.body.items.forEach((item: { isVegetarian: boolean }) => {
        expect(item.isVegetarian).toBe(true);
      });
    });
  });

  describe('GET /api/v1/menu/:id', () => {
    it('should return a single menu item', async () => {
      const listResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu?limit=1')
        .expect(200);

      if (listResponse.body.items.length > 0) {
        const itemId = listResponse.body.items[0].id;
        const response = await request(API_BASE.replace('/api/v1', ''))
          .get(`/api/v1/menu/${itemId}`)
          .expect(200);

        expect(response.body.id).toBe(itemId);
      }
    });

    it('should return 404 for non-existent id', async () => {
      await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu/non-existent-id-12345')
        .expect(404);
    });
  });

  describe('GET /api/v1/menu/slug/:slug', () => {
    it('should return a menu item by slug', async () => {
      const listResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/menu?limit=1')
        .expect(200);

      if (listResponse.body.items.length > 0) {
        const slug = listResponse.body.items[0].slug;
        const response = await request(API_BASE.replace('/api/v1', ''))
          .get(`/api/v1/menu/slug/${slug}`)
          .expect(200);

        expect(response.body.slug).toBe(slug);
      }
    });
  });
});
