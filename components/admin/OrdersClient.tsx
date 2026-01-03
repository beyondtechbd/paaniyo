'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Loader2,
  Calendar,
  DollarSign,
  ShoppingBag,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  vendorAmount: number | null;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  vendor: {
    id: string;
    businessName: string;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    area: string;
  };
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
  items: OrderItem[];
  promoCode?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  _count: {
    items: number;
  };
}

interface OrdersClientProps {
  initialCounts: {
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
  initialStats: {
    todayOrders: number;
    todayRevenue: number;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  PAID: { label: 'Paid', color: 'bg-blue-100 text-blue-800', icon: <CreditCard className="w-3 h-3" /> },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: <Package className="w-3 h-3" /> },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="w-3 h-3" /> },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
};

export default function OrdersClient({ initialCounts, initialStats }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState(initialCounts);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update form state
  const [updateStatus, setUpdateStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.set('dateTo', dateTo);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();

      if (res.ok) {
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
        setCounts(data.counts);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleOpenUpdateModal = (order: Order) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
    setShowUpdateModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading('update');
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', data.message || 'Order updated successfully');
        setShowUpdateModal(false);
        fetchOrders();
      } else {
        showToast('error', data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('error', 'Failed to update order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Order cancelled successfully');
        fetchOrders();
      } else {
        showToast('error', data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('error', 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied to clipboard');
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'all', label: 'All Orders', count: counts.total },
    { id: 'PAID', label: 'Needs Processing', count: counts.paid },
    { id: 'PROCESSING', label: 'Processing', count: counts.processing },
    { id: 'SHIPPED', label: 'Shipped', count: counts.shipped },
    { id: 'DELIVERED', label: 'Delivered', count: counts.delivered },
    { id: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white flex items-center gap-2`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            {stats.todayOrders} orders today • {formatCurrency(stats.todayRevenue)} revenue
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Needs Processing</p>
              <p className="text-xl font-bold text-gray-900">{counts.paid}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-xl font-bold text-gray-900">{counts.shipped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-sky-200' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search and Date Filter */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <span className="flex items-center text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600" />
            <p className="text-gray-500 mt-2">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Payment</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                        <button
                          onClick={() => copyToClipboard(order.orderNumber)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {order.user.image ? (
                            <Image
                              src={order.user.image}
                              alt={order.user.name || ''}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {order.user.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{order.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                            {item.product.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400 m-2" />
                            )}
                          </div>
                        ))}
                        {order._count.items > 2 && (
                          <span className="text-xs text-gray-500">
                            +{order._count.items - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusConfig[order.status]?.icon}
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[order.paymentStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenUpdateModal(order)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        {['PENDING', 'PAID'].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel Order"
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-sky-600 text-white'
                        : 'border hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                    {statusConfig[selectedOrder.status]?.icon}
                    Order: {statusConfig[selectedOrder.status]?.label}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatusConfig[selectedOrder.paymentStatus]?.color}`}>
                    Payment: {paymentStatusConfig[selectedOrder.paymentStatus]?.label}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {selectedOrder.user.image ? (
                          <Image
                            src={selectedOrder.user.image}
                            alt={selectedOrder.user.name || ''}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedOrder.user.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.user.email}</p>
                      </div>
                    </div>
                    {selectedOrder.user.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {selectedOrder.user.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.name}</p>
                    <p className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.area}, {selectedOrder.shippingAddress.city}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedOrder.shippingAddress.phone}
                    </p>
                  </div>
                </div>

                {/* Tracking Info */}
                {selectedOrder.trackingNumber && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Tracking Information</h3>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Tracking Number</p>
                        <p className="font-medium text-gray-900">{selectedOrder.trackingNumber}</p>
                      </div>
                      {selectedOrder.trackingUrl && (
                        <a
                          href={selectedOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Track Package
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="border rounded-xl divide-y">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400 m-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.vendor?.businessName || 'Unknown Vendor'} • Qty: {item.quantity}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${statusConfig[item.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusConfig[item.status]?.label || item.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount {selectedOrder.promoCode && `(${selectedOrder.promoCode.code})`}</span>
                        <span>-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenUpdateModal(selectedOrder);
                    }}
                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    Update Status
                  </button>
                  {['PENDING', 'PAID'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleCancelOrder(selectedOrder.id);
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowUpdateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Update Order Status</h2>
                  <p className="text-sm text-gray-500">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Status Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Status
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Tracking Info (show when shipping) */}
                {(updateStatus === 'SHIPPED' || selectedOrder.status === 'SHIPPED') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking URL
                      </label>
                      <input
                        type="url"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </>
                )}

                {/* Warning for status changes */}
                {updateStatus === 'DELIVERED' && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Marking as delivered will credit vendor earnings to their balance.
                    </p>
                  </div>
                )}

                {updateStatus === 'CANCELLED' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                      Cancelling will restore product stock. Refund may need to be processed separately.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={actionLoading === 'update'}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'update' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Order'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
