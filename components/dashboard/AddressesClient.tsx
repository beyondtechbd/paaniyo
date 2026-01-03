// components/dashboard/AddressesClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Home,
  Building2,
  Phone,
  Edit2,
  Trash2,
  Star,
  Loader2,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string | null;
  isDefault: boolean;
  type: 'HOME' | 'OFFICE';
}

interface AddressesClientProps {
  initialAddresses: Address[];
}

const districts = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Narayanganj', 'Bogra', 'Cox\'s Bazar', 'Jessore', 'Dinajpur', 'Tangail',
];

export function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
    type: 'HOME' as 'HOME' | 'OFFICE',
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      label: '',
      fullName: '',
      phone: '',
      street: '',
      city: '',
      district: 'Dhaka',
      postalCode: '',
      type: 'HOME',
      isDefault: false,
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  const openEditForm = (address: Address) => {
    setFormData({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode || '',
      type: address.type,
      isDefault: address.isDefault,
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.label || !formData.fullName || !formData.phone || !formData.street || !formData.city || !formData.district) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save address');
      }

      const savedAddress = await res.json();

      if (editingAddress) {
        // Update existing
        setAddresses(prev => prev.map(a => {
          if (a.id === savedAddress.id) return savedAddress;
          if (savedAddress.isDefault && a.isDefault) return { ...a, isDefault: false };
          return a;
        }));
        toast({ title: 'Address updated', variant: 'success' });
      } else {
        // Add new
        if (savedAddress.isDefault) {
          setAddresses(prev => [savedAddress, ...prev.map(a => ({ ...a, isDefault: false }))]);
        } else {
          setAddresses(prev => [savedAddress, ...prev]);
        }
        toast({ title: 'Address added', variant: 'success' });
      }

      resetForm();
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete address');
      }

      setAddresses(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Address deleted', variant: 'success' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set default');
      }

      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id,
      })));
      toast({ title: 'Default address updated', variant: 'success' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              My Addresses
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your delivery addresses for faster checkout
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </div>
      </motion.div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            No addresses yet
          </h3>
          <p className="mt-2 max-w-sm text-slate-600 dark:text-slate-400">
            Add your first delivery address to speed up your checkout process
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {addresses.map((address, index) => {
              const TypeIcon = address.type === 'HOME' ? Home : Building2;
              
              return (
                <motion.div
                  key={address.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-5 transition-all dark:bg-slate-800 ${
                    address.isDefault
                      ? 'border-primary shadow-lg'
                      : 'border-slate-200 hover:border-primary/30 dark:border-slate-700'
                  }`}
                >
                  {/* Default Badge */}
                  {address.isDefault && (
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      address.type === 'HOME' ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 pr-16">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {address.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {address.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.district}
                      {address.postalCode && ` - ${address.postalCode}`}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {address.phone}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        disabled={settingDefaultId === address.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-50 dark:text-slate-400"
                      >
                        {settingDefaultId === address.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(address)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      disabled={deletingId === address.id}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Address Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={resetForm}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Address Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'HOME' })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 transition-all ${
                        formData.type === 'HOME'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-slate-600 hover:border-primary/30 dark:border-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Home className="h-5 w-5" />
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'OFFICE' })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 transition-all ${
                        formData.type === 'OFFICE'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-slate-600 hover:border-primary/30 dark:border-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                      Office
                    </button>
                  </div>
                </div>

                {/* Label */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., My Home, Main Office"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="Recipient's full name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="+880 1XXXXXXXXX"
                  />
                </div>

                {/* Street Address */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Street Address *
                  </label>
                  <textarea
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="House/Flat, Road, Area"
                  />
                </div>

                {/* City & District */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      placeholder="City/Area"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      District *
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {districts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Postal Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="1200"
                  />
                </div>

                {/* Set as Default */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition-all hover:border-primary/30 dark:border-slate-600">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Set as default address</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      This address will be pre-selected during checkout
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
