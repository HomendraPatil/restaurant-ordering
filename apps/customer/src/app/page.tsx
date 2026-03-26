export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Restaurant</h1>
          <nav className="flex gap-6">
            <a href="/" className="hover:text-primary">
              Menu
            </a>
            <a href="/cart" className="hover:text-primary">
              Cart
            </a>
            <a href="/orders" className="hover:text-primary">
              Orders
            </a>
          </nav>
        </div>
      </header>

      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Delicious Food Delivered</h2>
          <p className="text-muted-foreground text-lg">
            Order your favorite dishes from the comfort of your home
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">Featured Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Starters', 'Main Course', 'Biryani', 'Desserts'].map((category) => (
              <a
                key={category}
                href={`/menu?category=${category.toLowerCase().replace(' ', '-')}`}
                className="group relative overflow-hidden rounded-lg aspect-square bg-muted"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h4 className="text-white font-semibold text-lg">{category}</h4>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Restaurant. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
