'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Ticket,
  Percent,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Users,
  ShoppingBag,
  X,
  Copy,
  RefreshCw,
  AlertTriangle,
  Tag,
} from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderBDT: number | null;
  maxDiscountBDT: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
}

interface PromosClientProps {
  initialCounts: {
    active: number;
    inactive: number;
    expired: number;
    total: number;
  };
  initialStats: {
    totalUsage: number;
  };
}

export default function PromosClient({ initialCounts, initialStats }: PromosClientProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState(initialCounts);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderBDT: '',
    maxDiscountBDT: '',
    usageLimit: '',
    perUserLimit: '1',
    startsAt: '',
    expiresAt: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchPromoCodes = useCallback(async () => {
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

      const res = await fetch(`/api/admin/promos?${params}`);
      const data = await res.json();

      if (res.ok) {
        setPromoCodes(data.promoCodes);
        setTotalPages(data.pagination.pages);
        setCounts(data.counts);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      showToast('error', 'Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

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
    fetchPromoCodes();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderBDT: '',
      maxDiscountBDT: '',
      usageLimit: '',
      perUserLimit: '1',
      startsAt: '',
      expiresAt: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (formData.code.length < 3 || formData.code.length > 20) {
      errors.code = 'Code must be 3-20 characters';
    }

    if (!formData.discountValue) {
      errors.discountValue = 'Discount value is required';
    } else if (parseFloat(formData.discountValue) <= 0) {
      errors.discountValue = 'Must be a positive number';
    } else if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      errors.discountValue = 'Percentage cannot exceed 100%';
    }

    if (formData.startsAt && formData.expiresAt) {
      if (new Date(formData.expiresAt) <= new Date(formData.startsAt)) {
        errors.expiresAt = 'Expiry must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePromo = async () => {
    if (!validateForm()) return;

    setActionLoading('create');
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || undefined,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minOrderBDT: formData.minOrderBDT ? parseFloat(formData.minOrderBDT) : undefined,
          maxDiscountBDT: formData.maxDiscountBDT ? parseFloat(formData.maxDiscountBDT) : undefined,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
          perUserLimit: parseInt(formData.perUserLimit),
          startsAt: formData.startsAt || undefined,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Promo code created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        showToast('error', data.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      showToast('error', 'Failed to create promo code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEditModal = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minOrderBDT: promo.minOrderBDT?.toString() || '',
      maxDiscountBDT: promo.maxDiscountBDT?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      perUserLimit: promo.perUserLimit.toString(),
      startsAt: promo.startsAt ? new Date(promo.startsAt).toISOString().slice(0, 16) : '',
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdatePromo = async () => {
    if (!selectedPromo || !validateForm()) return;

    setActionLoading('update');
    try {
      const res = await fetch(`/api/admin/promos/${selectedPromo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || null,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minOrderBDT: formData.minOrderBDT ? parseFloat(formData.minOrderBDT) : null,
          maxDiscountBDT: formData.maxDiscountBDT ? parseFloat(formData.maxDiscountBDT) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          perUserLimit: parseInt(formData.perUserLimit),
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Promo code updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        showToast('error', data.error || 'Failed to update promo code');
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      showToast('error', 'Failed to update promo code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    setActionLoading(promo.id);
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', `Promo code ${promo.isActive ? 'deactivated' : 'activated'}`);
        fetchPromoCodes();
      } else {
        showToast('error', data.error || 'Failed to update promo code');
      }
    } catch (error) {
      console.error('Error toggling promo code:', error);
      showToast('error', 'Failed to update promo code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePromo = async (promo: PromoCode) => {
    if (!confirm(`Are you sure you want to delete "${promo.code}"?`)) return;

    setActionLoading(promo.id);
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', data.message);
        fetchPromoCodes();
      } else {
        showToast('error', data.error || 'Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      showToast('error', 'Failed to delete promo code');
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
    });
  };

  const getPromoStatus = (promo: PromoCode) => {
    const now = new Date();
    if (!promo.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (promo.expiresAt && new Date(promo.expiresAt) < now) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    if (promo.startsAt && new Date(promo.startsAt) > now) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return { label: 'Exhausted', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const tabs = [
    { id: 'all', label: 'All Codes', count: counts.total },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'inactive', label: 'Inactive', count: counts.inactive },
    { id: 'expired', label: 'Expired', count: counts.expired },
  ];

  const PromoForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Promo Code *
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g., SUMMER25"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase ${
            formErrors.code ? 'border-red-300' : ''
          }`}
        />
        {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Summer sale discount"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* Discount Type and Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Type *
          </label>
          <select
            value={formData.discountType}
            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (৳)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Value *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {formData.discountType === 'percentage' ? '%' : '৳'}
            </span>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              placeholder="0"
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
                formErrors.discountValue ? 'border-red-300' : ''
              }`}
            />
          </div>
          {formErrors.discountValue && <p className="text-red-500 text-xs mt-1">{formErrors.discountValue}</p>}
        </div>
      </div>

      {/* Min Order and Max Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Order (৳)
          </label>
          <input
            type="number"
            value={formData.minOrderBDT}
            onChange={(e) => setFormData({ ...formData, minOrderBDT: e.target.value })}
            placeholder="No minimum"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Discount (৳)
          </label>
          <input
            type="number"
            value={formData.maxDiscountBDT}
            onChange={(e) => setFormData({ ...formData, maxDiscountBDT: e.target.value })}
            placeholder="No maximum"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Usage Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Usage Limit
          </label>
          <input
            type="number"
            value={formData.usageLimit}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
            placeholder="Unlimited"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Per User Limit
          </label>
          <input
            type="number"
            value={formData.perUserLimit}
            onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
            placeholder="1"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={formData.startsAt}
            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
              formErrors.expiresAt ? 'border-red-300' : ''
            }`}
          />
          {formErrors.expiresAt && <p className="text-red-500 text-xs mt-1">{formErrors.expiresAt}</p>}
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 mt-1">
            {counts.active} active codes • {stats.totalUsage} total uses
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchPromoCodes()}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold text-gray-900">{counts.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-xl font-bold text-gray-900">{counts.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-xl font-bold text-gray-900">{counts.expired}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Uses</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600" />
            <p className="text-gray-500 mt-2">Loading promo codes...</p>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No promo codes found</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Create First Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Discount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Usage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Validity</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promoCodes.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <motion.tr
                      key={promo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900">{promo.code}</span>
                          <button
                            onClick={() => copyToClipboard(promo.code)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {promo.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {promo.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-900">{promo.discountValue}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-900">{formatCurrency(promo.discountValue)}</span>
                            </>
                          )}
                        </div>
                        {promo.minOrderBDT && (
                          <p className="text-xs text-gray-500 mt-0.5">Min: {formatCurrency(promo.minOrderBDT)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{promo.usageCount}</span>
                          {promo.usageLimit && (
                            <span className="text-gray-400">/ {promo.usageLimit}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{promo.perUserLimit}/user</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {promo.startsAt || promo.expiresAt ? (
                          <div className="space-y-0.5">
                            {promo.startsAt && (
                              <p className="text-gray-600">From: {formatDate(promo.startsAt)}</p>
                            )}
                            {promo.expiresAt && (
                              <p className="text-gray-600">Until: {formatDate(promo.expiresAt)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No limits</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPromo(promo);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(promo)}
                            disabled={actionLoading === promo.id}
                            className={`p-2 rounded-lg transition-colors ${
                              promo.isActive
                                ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={promo.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {actionLoading === promo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : promo.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo)}
                            disabled={actionLoading === promo.id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Create Promo Code</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <PromoForm />
              </div>
              <div className="border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePromo}
                  disabled={actionLoading === 'create'}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'create' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Code'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Edit Promo Code</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <PromoForm isEdit />
                {selectedPromo.usageCount > 0 && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      This code has been used {selectedPromo.usageCount} times. Changes may affect reporting.
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePromo}
                  disabled={actionLoading === 'update'}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'update' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Code'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPromo && (
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-mono">{selectedPromo.code}</h2>
                  {selectedPromo.description && (
                    <p className="text-sm text-gray-500">{selectedPromo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPromoStatus(selectedPromo).color}`}>
                    {getPromoStatus(selectedPromo).label}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-gray-900">
                    {selectedPromo.discountType === 'percentage'
                      ? `${selectedPromo.discountValue}%`
                      : formatCurrency(selectedPromo.discountValue)}
                  </span>
                </div>

                {/* Min Order */}
                {selectedPromo.minOrderBDT && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Minimum Order</span>
                    <span className="text-gray-900">{formatCurrency(selectedPromo.minOrderBDT)}</span>
                  </div>
                )}

                {/* Max Discount */}
                {selectedPromo.maxDiscountBDT && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Max Discount</span>
                    <span className="text-gray-900">{formatCurrency(selectedPromo.maxDiscountBDT)}</span>
                  </div>
                )}

                {/* Usage */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Usage</span>
                  <span className="text-gray-900">
                    {selectedPromo.usageCount}
                    {selectedPromo.usageLimit && ` / ${selectedPromo.usageLimit}`}
                  </span>
                </div>

                {/* Per User */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Per User Limit</span>
                  <span className="text-gray-900">{selectedPromo.perUserLimit}</span>
                </div>

                {/* Orders */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Orders Using Code</span>
                  <span className="text-gray-900">{selectedPromo.ordersCount}</span>
                </div>

                {/* Dates */}
                {(selectedPromo.startsAt || selectedPromo.expiresAt) && (
                  <div className="pt-4 border-t space-y-2">
                    {selectedPromo.startsAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Starts</span>
                        <span className="text-gray-900">{formatDate(selectedPromo.startsAt)}</span>
                      </div>
                    )}
                    {selectedPromo.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Expires</span>
                        <span className="text-gray-900">{formatDate(selectedPromo.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Created */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">{formatDate(selectedPromo.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEditModal(selectedPromo);
                  }}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  Edit Code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
