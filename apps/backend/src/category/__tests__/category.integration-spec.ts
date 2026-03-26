import * as request from 'supertest';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

describe('Category Integration Tests', () => {
  describe('GET /api/v1/categories', () => {
    it('should return all categories', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return paginated categories when pagination params provided', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should include _count for menu items', async () => {
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body[0]).toHaveProperty('_count');
      expect(response.body[0]._count).toHaveProperty('menuItems');
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return a single category by id', async () => {
      const listResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect(200);

      const categoryId = listResponse.body[0].id;
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
    });

    it('should include menu items', async () => {
      const listResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect(200);

      const categoryId = listResponse.body[0].id;
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200);

      expect(response.body).toHaveProperty('menuItems');
      expect(Array.isArray(response.body.menuItems)).toBe(true);
    });

    it('should return 404 for non-existent id', async () => {
      await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return a category by slug', async () => {
      const listResponse = await request(API_BASE.replace('/api/v1', ''))
        .get('/api/v1/categories')
        .expect(200);

      const slug = listResponse.body[0].slug;
      const response = await request(API_BASE.replace('/api/v1', ''))
        .get(`/api/v1/categories/slug/${slug}`)
        .expect(200);

      expect(response.body.slug).toBe(slug);
    });
  });
});
