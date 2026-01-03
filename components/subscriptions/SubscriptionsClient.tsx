'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, RefreshCw, Pause, Play, Calendar, MapPin, Package,
  ChevronRight, Droplets, Clock, Check, X
} from 'lucide-react';

const frequencyLabels: Record<string, string> = {
  DAILY: 'Daily',
  ALTERNATE: 'Every other day',
  TWICE_WEEKLY: 'Twice a week',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};

interface SubscriptionsClientProps {
  data: {
    subscriptions: any[];
    subscribableProducts: any[];
    addresses: any[];
  };
}

export function SubscriptionsClient({ data }: SubscriptionsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState('WEEKLY');
  const [addressId, setAddressId] = useState(data.addresses[0]?.id || '');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (Object.keys(selectedProducts).length === 0) {
      alert('Please select at least one product');
      return;
    }
    if (!addressId) {
      alert('Please select a delivery address');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(selectedProducts).map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
          frequency,
          addressId,
        }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create subscription');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev[productId]) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: 1 };
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      const { [productId]: _, ...rest } = selectedProducts;
      setSelectedProducts(rest);
    } else {
      setSelectedProducts((prev) => ({ ...prev, [productId]: qty }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Subscriptions
            </h1>
            <p className="text-slate-600">Automatic delivery, never run out</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700"
          >
            <Plus className="w-5 h-5" />
            New Subscription
          </button>
        </div>

        {/* Active Subscriptions */}
        {data.subscriptions.length > 0 ? (
          <div className="space-y-4 mb-8">
            {data.subscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-cyan-600" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {frequencyLabels[sub.frequency]} Delivery
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {sub.address?.area}, {sub.address?.district}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sub.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700'
                      : sub.status === 'PAUSED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {sub.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.product.brand?.name}</p>
                      </div>
                      <span className="text-sm font-medium">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t flex gap-2">
                  {sub.status === 'ACTIVE' && (
                    <button className="flex items-center gap-1 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg">
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  )}
                  {sub.status === 'PAUSED' && (
                    <button className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg">
                      <Play className="w-4 h-4" />
                      Resume
                    </button>
                  )}
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    Edit Schedule
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : !showCreate && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <RefreshCw className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No active subscriptions</h2>
            <p className="text-slate-600 mb-6">Set up automatic delivery for your water needs</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl"
            >
              <Plus className="w-5 h-5" />
              Create Subscription
            </button>
          </div>
        )}

        {/* Create Subscription Form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Subscription</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Select Products */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Select Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {data.subscribableProducts.map((product) => {
                  const isSelected = !!selectedProducts[product.id];
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.brand?.name}</p>
                      </div>
                      <span className="font-bold text-sm">৳{Number(product.priceBDT)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quantities */}
              {Object.keys(selectedProducts).length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-medium mb-3">Quantities</h4>
                  {Object.entries(selectedProducts).map(([productId, qty]) => {
                    const product = data.subscribableProducts.find((p) => p.id === productId);
                    if (!product) return null;
                    return (
                      <div key={productId} className="flex items-center justify-between py-2">
                        <span className="text-sm">{product.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(productId, qty - 1)}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-white"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(productId, qty + 1)}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Frequency */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Delivery Frequency</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(frequencyLabels).filter(([k]) => k !== 'CUSTOM').map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFrequency(key)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      frequency === key
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Delivery Address</h3>
              {data.addresses.length > 0 ? (
                <div className="space-y-2">
                  {data.addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setAddressId(addr.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        addressId === addr.id
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {addr.address}, {addr.area}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <Link
                  href="/dashboard/addresses"
                  className="block p-4 border-2 border-dashed rounded-xl text-center text-slate-500 hover:border-cyan-500"
                >
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  Add Delivery Address
                </Link>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={creating || Object.keys(selectedProducts).length === 0 || !addressId}
              className="w-full py-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Subscription'}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
