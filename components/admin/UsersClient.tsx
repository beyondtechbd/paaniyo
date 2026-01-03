'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserX,
  UserCheck,
  Shield,
  ShieldCheck,
  Store,
  User,
  X,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  MessageSquare,
  MapPin,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  emailVerified: string | null;
  isSuspended: boolean | null;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
    addresses?: number;
  };
  vendor?: {
    id: string;
    businessName: string;
    status: string;
    balance?: number;
    commissionRate?: number;
    brands?: Array<{
      id: string;
      name: string;
      _count: { products: number };
    }>;
  } | null;
  totalSpent?: number;
  orders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    title: string | null;
    isApproved: boolean;
    createdAt: string;
    product: { name: string };
  }>;
}

interface UsersClientProps {
  initialCounts: {
    customer: number;
    vendor: number;
    admin: number;
    suspended: number;
    total: number;
  };
}

export default function UsersClient({ initialCounts }: UsersClientProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'vendor' | 'admin' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (activeTab === 'suspended') {
        params.set('status', 'suspended');
      } else if (activeTab !== 'all') {
        params.set('role', activeTab.toUpperCase());
      }
      
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUserDetails = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();

      if (res.ok) {
        setSelectedUser(data.user);
        setShowDetailModal(true);
      } else {
        showToast('error', data.error || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      showToast('error', 'Failed to fetch user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'suspend' | 'unsuspend') => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        showToast('success', `User ${action}ed successfully`);
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser((prev) => prev ? { ...prev, isSuspended: action === 'suspend' } : null);
        }
      } else {
        const data = await res.json();
        showToast('error', data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      showToast('error', `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Users', count: counts.total, icon: Users },
    { id: 'customer', label: 'Customers', count: counts.customer, icon: User },
    { id: 'vendor', label: 'Vendors', count: counts.vendor, icon: Store },
    { id: 'admin', label: 'Admins', count: counts.admin, icon: Shield },
    { id: 'suspended', label: 'Suspended', count: counts.suspended, icon: UserX },
  ] as const;

  const getRoleBadge = (role: string, isSuspended?: boolean | null) => {
    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          <UserX className="w-3 h-3" />
          Suspended
        </span>
      );
    }

    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        );
      case 'VENDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400">
            <Store className="w-3 h-3" />
            Vendor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            <User className="w-3 h-3" />
            Customer
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-white/60 mt-1">View and manage platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-xl border transition-all text-left ${
              activeTab === tab.id
                ? 'bg-sky-500/20 border-sky-500/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeTab === tab.id ? 'bg-sky-500/30' : 'bg-white/10'
              }`}>
                <tab.icon className={`w-5 h-5 ${
                  activeTab === tab.id ? 'text-sky-400' : 'text-white/60'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tab.count}</p>
                <p className="text-sm text-white/60">{tab.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-white/60">User</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Contact</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Activity</th>
                  <th className="text-left p-4 text-sm font-medium text-white/60">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || 'User'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (user.name || user.email)[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-sm text-white/60 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-white/60 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.emailVerified ? (
                            <span className="text-green-400">Verified</span>
                          ) : (
                            <span className="text-amber-400">Unverified</span>
                          )}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-white/60 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {getRoleBadge(user.role, user.isSuspended)}
                        {user.vendor && (
                          <p className="text-xs text-white/40 mt-1">{user.vendor.businessName}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1" title="Orders">
                          <ShoppingBag className="w-3 h-3" />
                          {user._count.orders}
                        </span>
                        <span className="flex items-center gap-1" title="Reviews">
                          <MessageSquare className="w-3 h-3" />
                          {user._count.reviews}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchUserDetails(user.id)}
                          disabled={detailLoading}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.isSuspended ? (
                          <button
                            onClick={() => handleAction(user.id, 'unsuspend')}
                            disabled={actionLoading === user.id}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Unsuspend User"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user.id, 'suspend')}
                            disabled={actionLoading === user.id || user.role === 'ADMIN'}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={user.role === 'ADMIN' ? 'Cannot suspend admin' : 'Suspend User'}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-white/60 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">User Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                    {selectedUser.image ? (
                      <Image
                        src={selectedUser.image}
                        alt={selectedUser.name || 'User'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (selectedUser.name || selectedUser.email)[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-semibold text-white truncate">
                      {selectedUser.name || 'No name'}
                    </h4>
                    <p className="text-white/60">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleBadge(selectedUser.role, selectedUser.isSuspended)}
                      {selectedUser.emailVerified && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Email Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="w-4 h-4 text-sky-400" />
                      <span className="text-sm text-white/60">Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedUser._count.orders}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-white/60">Reviews</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedUser._count.reviews}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-white/60">Addresses</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedUser._count.addresses || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/60">Total Spent</span>
                    </div>
                    <p className="text-xl font-bold text-white">{formatCurrency(selectedUser.totalSpent || 0)}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <h5 className="text-sm font-medium text-white/60 mb-3">Contact Information</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-white/40" />
                      <span className="text-white">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-white/40" />
                        <span className="text-white">{selectedUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-white">
                        Joined {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor Info */}
                {selectedUser.vendor && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <h5 className="text-sm font-medium text-white/60 mb-3">Vendor Information</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Business Name</span>
                        <span className="text-white font-medium">{selectedUser.vendor.businessName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Status</span>
                        <span className={`text-sm font-medium ${
                          selectedUser.vendor.status === 'APPROVED' ? 'text-green-400' :
                          selectedUser.vendor.status === 'PENDING' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{selectedUser.vendor.status}</span>
                      </div>
                      {selectedUser.vendor.balance !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Balance</span>
                          <span className="text-white font-medium">{formatCurrency(selectedUser.vendor.balance)}</span>
                        </div>
                      )}
                      {selectedUser.vendor.commissionRate !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Commission Rate</span>
                          <span className="text-white font-medium">{selectedUser.vendor.commissionRate}%</span>
                        </div>
                      )}
                      {selectedUser.vendor.brands && selectedUser.vendor.brands.length > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-white/60 text-sm">Brands</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedUser.vendor.brands.map((brand) => (
                              <span key={brand.id} className="px-2 py-1 bg-white/10 rounded-lg text-sm text-white">
                                {brand.name} ({brand._count.products} products)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                {selectedUser.orders && selectedUser.orders.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <h5 className="text-sm font-medium text-white/60 mb-3">Recent Orders</h5>
                    <div className="space-y-2">
                      {selectedUser.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div>
                            <p className="text-sm text-white font-medium">{order.orderNumber}</p>
                            <p className="text-xs text-white/40">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">{formatCurrency(order.total)}</p>
                            <p className={`text-xs ${
                              order.status === 'DELIVERED' ? 'text-green-400' :
                              order.status === 'CANCELLED' ? 'text-red-400' :
                              'text-amber-400'
                            }`}>{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {selectedUser.isSuspended ? (
                    <button
                      onClick={() => handleAction(selectedUser.id, 'unsuspend')}
                      disabled={actionLoading === selectedUser.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedUser.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Unsuspend User
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(selectedUser.id, 'suspend')}
                      disabled={actionLoading === selectedUser.id || selectedUser.role === 'ADMIN'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedUser.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          Suspend User
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>

                {selectedUser.role === 'ADMIN' && (
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Admin accounts cannot be suspended</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p>{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
