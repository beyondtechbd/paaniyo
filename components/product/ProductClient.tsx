'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Minus, Plus, ShoppingCart, Heart, Truck, Shield, RefreshCw,
  Droplets, Info, Star, ChevronRight, Check, AlertCircle
} from 'lucide-react';

interface ProductClientProps {
  product: any;
  related: any[];
}

export function ProductClient({ product, related }: ProductClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [exchangeJars, setExchangeJars] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const isJar = product.type === 'JAR';
  const hasDeposit = product.depositBDT && Number(product.depositBDT) > 0;
  const price = Number(product.priceBDT);
  const deposit = hasDeposit ? Number(product.depositBDT) : 0;
  
  // Calculate total with deposit logic
  const newJars = Math.max(0, quantity - exchangeJars);
  const depositTotal = newJars * deposit;
  const total = (quantity * price) + depositTotal;

  const addToCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          exchangeJars: isJar ? exchangeJars : 0,
        }),
      });
      
      if (res.ok) {
        router.push('/cart');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add to cart');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-cyan-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/shop" className="hover:text-cyan-600">Shop</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              {product.images?.[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Droplets className="w-24 h-24 text-slate-300" />
                </div>
              )}
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      activeImage === i ? 'border-cyan-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Brand */}
            <Link 
              href={`/shop?brand=${product.brand?.slug}`}
              className="text-cyan-600 font-medium hover:underline"
            >
              {product.brand?.name}
            </Link>

            {/* Name */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviews?.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.reviews.reduce((a: number, r: any) => a + r.rating, 0) / product.reviews.length)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-500">
                  ({product.reviews.length} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  ৳{price}
                </span>
                {product.compareBDT && Number(product.compareBDT) > price && (
                  <span className="text-lg text-slate-400 line-through">
                    ৳{Number(product.compareBDT)}
                  </span>
                )}
              </div>
              
              {hasDeposit && (
                <p className="text-amber-600 mt-1 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  + ৳{deposit} refundable jar deposit
                </p>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              {product.shortDesc || product.description}
            </p>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {product.volumeMl && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Volume</p>
                  <p className="font-medium">
                    {product.volumeMl >= 1000 ? `${product.volumeMl / 1000}L` : `${product.volumeMl}ml`}
                  </p>
                </div>
              )}
              {product.packSize > 1 && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Pack Size</p>
                  <p className="font-medium">{product.packSize} bottles</p>
                </div>
              )}
              {product.sourceType && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Source</p>
                  <p className="font-medium">{product.sourceType}</p>
                </div>
              )}
              {product.tdsLevel && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">TDS Level</p>
                  <p className="font-medium">{product.tdsLevel} ppm</p>
                </div>
              )}
              {product.phLevel && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">pH Level</p>
                  <p className="font-medium">{Number(product.phLevel)}</p>
                </div>
              )}
            </div>

            {/* Quantity & Jar Exchange */}
            <div className="mt-6 space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-slate-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-slate-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Jar Exchange */}
              {isJar && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Empty jars to exchange (optional)
                  </label>
                  <p className="text-xs text-blue-600 mb-3">
                    Return empty jars to avoid deposit charges
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExchangeJars(Math.max(0, exchangeJars - 1))}
                      className="w-10 h-10 rounded-lg border border-blue-300 flex items-center justify-center hover:bg-blue-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-medium">{exchangeJars}</span>
                    <button
                      onClick={() => setExchangeJars(Math.min(quantity, exchangeJars + 1))}
                      className="w-10 h-10 rounded-lg border border-blue-300 flex items-center justify-center hover:bg-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mt-6 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-1">
                <span>Product ({quantity}x ৳{price})</span>
                <span>৳{quantity * price}</span>
              </div>
              {hasDeposit && (
                <div className="flex justify-between text-sm mb-1 text-amber-600">
                  <span>Deposit ({newJars} new jars)</span>
                  <span>৳{depositTotal}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                <span>Total</span>
                <span>৳{total}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={addToCart}
                disabled={loading || product.stock < 1}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {loading ? 'Adding...' : 'Add to Cart'}
              </button>
              <button className="w-14 h-14 flex items-center justify-center border rounded-xl hover:bg-slate-100">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Stock */}
            {product.stock < 10 && product.stock > 0 && (
              <p className="mt-3 text-amber-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Only {product.stock} left in stock
              </p>
            )}

            {/* Trust */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-3">
                <Truck className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500 mt-1">Free delivery over ৳500</p>
              </div>
              <div className="p-3">
                <Shield className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500 mt-1">Quality assured</p>
              </div>
              <div className="p-3">
                <RefreshCw className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500 mt-1">Easy returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-slate-100">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Droplets className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-cyan-600">{p.brand?.name}</p>
                    <h3 className="font-medium text-sm mt-1 line-clamp-2">{p.name}</h3>
                    <p className="font-bold mt-2">৳{Number(p.priceBDT)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
