import { AdminLayout } from '@/app/AdminLayout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
