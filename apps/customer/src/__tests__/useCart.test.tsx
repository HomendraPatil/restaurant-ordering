import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCart } from '@/hooks/useCart';

const localStorageMock = {
  getItem: jest.fn().mockReturnValue('test-session-id'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch cart with empty items initially', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], subtotal: 0, taxAmount: 0, total: 0 }),
    });

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ items: [], subtotal: 0, taxAmount: 0, total: 0 });
  });

  it('should fetch cart with items', async () => {
    const mockCart = {
      items: [{ id: '1', menuItem: { name: 'Burger' }, quantity: 2, unitPrice: '10' }],
      subtotal: 20,
      taxAmount: 3.6,
      total: 23.6,
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockCart,
    });

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(23.6);
  });

  it('should include session ID in request', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], subtotal: 0, taxAmount: 0, total: 0 }),
    });

    renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cart'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-session-id': 'test-session-id',
          }),
        })
      );
    });
  });
});

describe('useAddToCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add item to cart', async () => {
    const mockResponse = {
      id: 'cart-item-1',
      menuItem: { id: '1', name: 'Pizza' },
      quantity: 1,
      unitPrice: '15',
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() });

    result.current.mutate({
      menuItemId: '1',
      quantity: 1,
      unitPrice: 15,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
