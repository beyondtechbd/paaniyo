'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight, Droplets,
  Info, RefreshCw
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  brand: string;
  image: string | null;
  price: number;
  deposit: number;
  quantity: number;
  exchangeJars: number;
  type: string;
  volumeMl: number;
  itemTotal: number;
  itemDeposit: number;
}

export function CartClient() {
  const router = useRouter();
  const [cart, setCart] = useState<{
    items: CartItem[];
    subtotal: number;
    deposit: number;
    total: number;
  }>({ items: [], subtotal: 0, deposit: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number, exchangeJars?: number) => {
    setUpdating(itemId);
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity, exchangeJars }),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-slate-300 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
          <p className="text-slate-600 mb-8">Start shopping to add items to your cart</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700"
          >
            <ShoppingBag className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Shopping Cart ({cart.items.length} items)
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-4 ${
                  updating === item.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link href={`/product/${item.slug}`} className="shrink-0">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Droplets className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cyan-600 font-medium">{item.brand}</p>
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    {item.volumeMl && (
                      <p className="text-xs text-slate-500 mt-1">
                        {item.volumeMl >= 1000 ? `${item.volumeMl / 1000}L` : `${item.volumeMl}ml`}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ৳{item.price}
                      </span>
                      {item.deposit > 0 && (
                        <span className="text-xs text-amber-600 ml-2">
                          +৳{item.deposit} deposit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Jar Exchange */}
                {item.type === 'JAR' && item.deposit > 0 && (
                  <div className="mt-4 pt-4 border-t bg-blue-50 dark:bg-blue-900/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Empty jars to exchange:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity, Math.max(0, item.exchangeJars - 1))}
                          className="w-8 h-8 rounded-lg border border-blue-300 flex items-center justify-center hover:bg-blue-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.exchangeJars}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity, Math.min(item.quantity, item.exchangeJars + 1))}
                          className="w-8 h-8 rounded-lg border border-blue-300 flex items-center justify-center hover:bg-blue-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {item.exchangeJars > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ You'll save ৳{item.exchangeJars * item.deposit} by returning {item.exchangeJars} jar(s)
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">৳{cart.subtotal}</span>
                </div>
                
                {cart.deposit > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span className="flex items-center gap-1">
                      Jar Deposit
                      <Info className="w-3 h-3" />
                    </span>
                    <span className="font-medium">৳{cart.deposit}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className="text-green-600 font-medium">
                    {cart.subtotal >= 500 ? 'FREE' : '৳30'}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>৳{cart.total + (cart.subtotal >= 500 ? 0 : 30)}</span>
                </div>
              </div>

              {cart.deposit > 0 && (
                <p className="text-xs text-slate-500 mt-4 flex items-start gap-1">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  Jar deposit is refundable when you return empty jars
                </p>
              )}

              <Link
                href="/checkout"
                className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/shop"
                className="mt-3 flex items-center justify-center gap-2 w-full px-6 py-3 border rounded-xl hover:bg-slate-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
