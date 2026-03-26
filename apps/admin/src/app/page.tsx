export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Restaurant Admin</h1>
          <nav className="flex gap-6">
            <a href="/admin" className="hover:text-primary font-medium">
              Dashboard
            </a>
            <a href="/admin/orders" className="hover:text-primary">
              Orders
            </a>
            <a href="/admin/menu" className="hover:text-primary">
              Menu
            </a>
            <a href="/admin/users" className="hover:text-primary">
              Users
            </a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Orders', value: '0', color: 'blue' },
            { label: 'Revenue', value: '₹0', color: 'green' },
            { label: 'Active Orders', value: '0', color: 'orange' },
            { label: 'Users', value: '0', color: 'purple' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow p-6 border"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground text-center py-8">
              No orders yet. Start receiving orders to see them here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
