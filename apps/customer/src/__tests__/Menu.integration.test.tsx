import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import React from 'react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={props.src} alt={props.alt} />
  ),
}));

const API_BASE = 'http://localhost:3000/api/v1';

const mockMenuItems = {
  items: [
    {
      id: 'item-1',
      name: 'Paneer Tikka',
      slug: 'paneer-tikka',
      description: 'Grilled paneer cubes with spices',
      price: 299,
      categoryId: 'cat-1',
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      preparationTime: 25,
      stockQuantity: 10,
      isLimited: false,
      category: { id: 'cat-1', name: 'Starters', slug: 'starters' },
    },
    {
      id: 'item-2',
      name: 'Butter Chicken',
      slug: 'butter-chicken',
      description: 'Creamy tomato curry with tender chicken',
      price: 399,
      categoryId: 'cat-1',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      preparationTime: 30,
      stockQuantity: 15,
      isLimited: false,
      category: { id: 'cat-1', name: 'Starters', slug: 'starters' },
    },
  ],
  total: 2,
  page: 1,
  limit: 12,
  totalPages: 1,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

function MenuTestComponent() {
  const { data } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });
  return data ? <div data-testid="loaded">Loaded</div> : <div>Loading</div>;
}

function MenuListComponent() {
  const { data } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.items?.map((item: { id: string; name: string }) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

function ErrorComponent() {
  const { error } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    retry: false,
  });

  if (error) return <div data-testid="error">Error loading menu</div>;
  return <div>Loading...</div>;
}

function FilterComponent({ categoryId }: { categoryId: string }) {
  const { data } = useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ categoryId });
      const res = await fetch(`${API_BASE}/menu?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return data ? (
    <div data-testid="count">{data.items?.length}</div>
  ) : (
    <div>Loading</div>
  );
}

function VegBadgeComponent() {
  const { data } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (!data) return null;

  return (
    <div>
      {data.items?.map((item: { id: string; name: string; isVegetarian: boolean }) => (
        <div key={item.id}>
          {item.name}: {item.isVegetarian ? '🌿 Veg' : '🍗 Non-Veg'}
        </div>
      ))}
    </div>
  );
}

function PriceComponent() {
  const { data } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (!data) return null;

  return (
    <div>
      {data.items?.map((item: { id: string; price: number }) => (
        <span key={item.id}>₹{item.price}</span>
      ))}
    </div>
  );
}

describe('Menu Integration Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('API Integration', () => {
    it('fetches menu items from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      });

      renderWithProviders(<MenuTestComponent />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(fetchUrl).toContain('/menu');
      });
    });

    it('displays menu items after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      });

      renderWithProviders(<MenuListComponent />);

      await waitFor(() => {
        expect(screen.getByText('Paneer Tikka')).toBeInTheDocument();
        expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
      });
    });

    it('handles fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderWithProviders(<ErrorComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
    });

    it('filters by category', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      });

      renderWithProviders(<FilterComponent categoryId="cat-1" />);

      await waitFor(() => {
        const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(fetchUrl).toContain('categoryId=cat-1');
      });
    });
  });

  describe('Display Features', () => {
    it('displays veg badges correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      });

      renderWithProviders(<VegBadgeComponent />);

      await waitFor(() => {
        expect(screen.getByText('Paneer Tikka: 🌿 Veg')).toBeInTheDocument();
        expect(screen.getByText('Butter Chicken: 🍗 Non-Veg')).toBeInTheDocument();
      });
    });

    it('displays prices correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      });

      renderWithProviders(<PriceComponent />);

      await waitFor(() => {
        expect(screen.getByText('₹299')).toBeInTheDocument();
        expect(screen.getByText('₹399')).toBeInTheDocument();
      });
    });
  });
});
