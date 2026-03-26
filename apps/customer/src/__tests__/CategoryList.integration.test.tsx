import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryList } from '@/components/CategoryList';

const mockCategories = {
  items: [
    { id: 'cat-1', name: 'Starters', slug: 'starters', sortOrder: 1, isActive: true, _count: { menuItems: 5 } },
    { id: 'cat-2', name: 'Main Course', slug: 'main-course', sortOrder: 2, isActive: true, _count: { menuItems: 8 } },
    { id: 'cat-3', name: 'Beverages', slug: 'beverages', sortOrder: 3, isActive: true, _count: { menuItems: 6 } },
  ],
  total: 3,
  page: 1,
  limit: 8,
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

describe('CategoryList Integration Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('API Integration', () => {
    it('fetches categories from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      renderWithProviders(<CategoryList />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(fetchUrl).toContain('/categories');
      });
    });

    it('displays categories after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      renderWithProviders(<CategoryList />);

      await waitFor(() => {
        expect(screen.getByText('Starters')).toBeInTheDocument();
        expect(screen.getByText('Main Course')).toBeInTheDocument();
        expect(screen.getByText('Beverages')).toBeInTheDocument();
      });
    });

    it('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderWithProviders(<CategoryList />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('calls onSelectCategory with correct id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      const mockOnSelect = jest.fn();
      renderWithProviders(
        <CategoryList onSelectCategory={mockOnSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText('Starters')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Starters'));

      expect(mockOnSelect).toHaveBeenCalledWith('cat-1');
    });

    it('shows selected state with clear button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      const mockOnClear = jest.fn();
      renderWithProviders(
        <CategoryList selectedCategoryId="cat-1" onClearCategory={mockOnClear} />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(mockOnClear).toHaveBeenCalled();
    });

    it('handles empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 8, totalPages: 0 }),
      });

      renderWithProviders(<CategoryList />);

      await waitFor(() => {
        expect(screen.getByText(/no categories/i)).toBeInTheDocument();
      });
    });

    it('passes pagination params to API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      renderWithProviders(<CategoryList />);

      await waitFor(() => {
        const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(fetchUrl).toContain('page=1');
        expect(fetchUrl).toContain('limit=');
      });
    });
  });

  describe('User Interactions', () => {
    it('toggles category selection on click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      const mockOnSelect = jest.fn();
      const mockOnClear = jest.fn();
      renderWithProviders(
        <CategoryList
          selectedCategoryId="cat-1"
          onSelectCategory={mockOnSelect}
          onClearCategory={mockOnClear}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /clear/i })).toHaveLength(1);
      });

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(mockOnClear).toHaveBeenCalled();
    });
  });
});
