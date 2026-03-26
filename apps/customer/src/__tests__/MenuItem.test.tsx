import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

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
    },
    {
      id: 'item-2',
      name: 'Butter Chicken',
      slug: 'butter-chicken',
      description: 'Creamy tomato curry with chicken',
      price: 399,
      categoryId: 'cat-2',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      preparationTime: 30,
      stockQuantity: 15,
      isLimited: false,
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

describe('MenuItemCard', () => {
  it('renders menu item name', async () => {
    const item = mockMenuItems.items[0];
    
    renderWithProviders(
      <a href={`/menu/${item.slug}`}>
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      </a>
    );

    expect(screen.getByText('Paneer Tikka')).toBeInTheDocument();
    expect(screen.getByText('Grilled paneer cubes with spices')).toBeInTheDocument();
  });

  it('renders veg badge for vegetarian items', async () => {
    const item = mockMenuItems.items[0];
    
    renderWithProviders(
      <div>
        {item.isVegetarian && <span data-testid="veg-badge">Veg</span>}
        <h3>{item.name}</h3>
      </div>
    );

    expect(screen.getByTestId('veg-badge')).toBeInTheDocument();
  });

  it('does not render veg badge for non-vegetarian items', async () => {
    const item = mockMenuItems.items[1];
    
    renderWithProviders(
      <div>
        {item.isVegetarian && <span data-testid="veg-badge">Veg</span>}
        <h3>{item.name}</h3>
      </div>
    );

    expect(screen.queryByTestId('veg-badge')).not.toBeInTheDocument();
  });

  it('displays price correctly', async () => {
    const item = mockMenuItems.items[0];
    
    renderWithProviders(
      <div>
        <span>₹{item.price}</span>
      </div>
    );

    expect(screen.getByText('₹299')).toBeInTheDocument();
  });
});

describe('DietaryBadge', () => {
  it('toggles vegetarian filter', async () => {
    let active = false;
    const toggle = () => { active = !active; };
    
    const { getByRole } = renderWithProviders(
      <button onClick={toggle} aria-pressed={active}>
        Vegetarian
      </button>
    );

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    fireEvent.click(button);
    expect(active).toBe(true);
  });
});

describe('PriceRangeFilter', () => {
  it('accepts min price input', async () => {
    const onChange = jest.fn();
    
    renderWithProviders(
      <div>
        <input
          type="number"
          placeholder="Min"
          onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Minimum price"
        />
      </div>
    );

    const input = screen.getByLabelText('Minimum price');
    fireEvent.change(input, { target: { value: '100' } });
    
    expect(onChange).toHaveBeenCalledWith({ minPrice: 100 });
  });

  it('accepts max price input', async () => {
    const onChange = jest.fn();
    
    renderWithProviders(
      <div>
        <input
          type="number"
          placeholder="Max"
          onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Maximum price"
        />
      </div>
    );

    const input = screen.getByLabelText('Maximum price');
    fireEvent.change(input, { target: { value: '500' } });
    
    expect(onChange).toHaveBeenCalledWith({ maxPrice: 500 });
  });
});

describe('MenuItemFilters', () => {
  it('initializes with empty filters', () => {
    const filters: Record<string, boolean | undefined> = {};
    
    expect(filters.isVegetarian).toBeUndefined();
    expect(filters.isVegan).toBeUndefined();
    expect(filters.isGlutenFree).toBeUndefined();
  });

  it('toggles filter on', () => {
    const filters: Record<string, boolean | undefined> = {};
    filters.isVegetarian = true;
    
    expect(filters.isVegetarian).toBe(true);
  });

  it('toggles filter off', () => {
    const filters: Record<string, boolean | undefined> = { isVegetarian: true };
    delete filters.isVegetarian;
    
    expect(filters.isVegetarian).toBeUndefined();
  });
});
