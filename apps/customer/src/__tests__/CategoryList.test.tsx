import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryList } from '@/components/CategoryList';

const mockCategories = {
  items: [
    { id: 'cat-1', name: 'Starters', slug: 'starters', sortOrder: 1, isActive: true },
    { id: 'cat-2', name: 'Main Course', slug: 'main-course', sortOrder: 2, isActive: true },
    { id: 'cat-3', name: 'Beverages', slug: 'beverages', sortOrder: 3, isActive: true },
  ],
  total: 3,
  page: 1,
  limit: 8,
  totalPages: 1,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('CategoryList', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading skeleton while fetching', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithProviders(<CategoryList />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders categories when fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
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

  it('shows error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    renderWithProviders(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no categories', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 8, totalPages: 0 }),
    });

    renderWithProviders(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByText(/no categories/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectCategory when category is clicked', async () => {
    const mockOnSelect = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    });

    renderWithProviders(
      <CategoryList onSelectCategory={mockOnSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Starters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Starters'));

    expect(mockOnSelect).toHaveBeenCalledWith('cat-1');
  });

  it('shows selected state indicator when category is selected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    });

    renderWithProviders(
      <CategoryList selectedCategoryId="cat-1" />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
  });

  it('calls onClearCategory when clear button is clicked', async () => {
    const mockOnClear = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    });

    renderWithProviders(
      <CategoryList selectedCategoryId="cat-1" onClearCategory={mockOnClear} />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('renders category with image when imageUrl is provided', async () => {
    const categoriesWithImages = {
      ...mockCategories,
      items: [
        { id: 'cat-1', name: 'Starters', slug: 'starters', sortOrder: 1, isActive: true, imageUrl: 'http://example.com/starters.jpg' },
      ],
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(categoriesWithImages),
    });

    renderWithProviders(<CategoryList />);

    await waitFor(() => {
      const image = screen.getByAltText('Starters') as HTMLImageElement;
      expect(image).toBeInTheDocument();
    });
  });
});
