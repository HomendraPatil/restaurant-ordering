import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartDrawer } from '@/components/CartDrawer';

const emptyCart = {
  items: [],
  subtotal: 0,
  taxAmount: 0,
  total: 0,
};

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

describe('CartDrawer', () => {
  it('should render cart drawer header when isOpen is true', () => {
    render(<CartDrawer isOpen={true} onClose={jest.fn()} cart={emptyCart} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/your cart/i)).toBeInTheDocument();
  });

  it('should not render content when isOpen is false', () => {
    const { container } = render(<CartDrawer isOpen={false} onClose={jest.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(container.firstChild).toBeNull();
  });
});
