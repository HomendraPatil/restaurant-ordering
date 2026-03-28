'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { adminApi, AdminUser, UsersResponse, USER_ROLES } from '@/lib/api';
import { Role, ROLE_DISPLAY } from '@restaurant/types';

interface UserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

function UserModal({ user, isOpen, onClose }: UserModalProps) {
  if (!isOpen || !user) return null;

  const roleConfig = ROLE_DISPLAY[user.role as Role] || ROLE_DISPLAY[Role.CUSTOMER];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">User ID: {user.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{user.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.textColor} ${roleConfig.bgColor}`}>
                {roleConfig.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-medium text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const roleConfig = ROLE_DISPLAY[user.role as Role] || ROLE_DISPLAY[Role.CUSTOMER];

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.textColor} ${roleConfig.bgColor}`}>
              {roleConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate mt-1">{user.email}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user.phone || 'No phone'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              }) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      return adminApi.get(`/users?page=${page}&limit=12`, token ?? undefined);
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['admin-customers-count'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      return adminApi.get<UsersResponse>(`/users?role=${USER_ROLES.CUSTOMER}&limit=1`, token ?? undefined);
    },
  });

  const usersArray = Array.isArray(data?.items) 
    ? data.items 
    : (data as any)?.items || [];
  
  const filteredUsers = usersArray.filter((user: AdminUser) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  );

  const stats = {
    total: data?.total || 0,
    admins: usersArray.filter((u: AdminUser) => u.role === Role.ADMIN).length || 0,
    customers: customersData?.total || 0,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage customer accounts and permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-2xl font-bold text-green-600">{stats.customers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 bg-white"
        >
          <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : 'text-gray-600'}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No users found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Users will appear here when they sign up'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {filteredUsers.map((user: AdminUser) => (
              <UserCard
                key={user.id}
                user={user}
                onClick={() => setSelectedUser(user)}
              />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, data.total)} of {data.total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <UserModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

export default function DashboardWithLayout() {
  return <AdminUsersPage />;
}
