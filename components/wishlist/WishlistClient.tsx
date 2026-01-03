// components/wishlist/WishlistClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Loader2,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    image: string;
    stock: number;
    freeShipping: boolean;
    volumeMl: number | null;
    avgRating: number;
    reviewCount: number;
    available: boolean;
    discount: number;
    brand: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
}

export function WishlistClient({ initialItems }: WishlistClientProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingToCartIds, setAddingToCartIds] = useState<Set<string>>(new Set());

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRemove = async (productId: string) => {
    setRemovingIds(prev => new Set(prev).add(productId));

    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove');

      setItems(prev => prev.filter(item => item.productId !== productId));
      toast({ title: 'Removed from wishlist' });
    } catch (error) {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.product.available) {
      toast({ title: 'Product unavailable', variant: 'destructive' });
      return;
    }

    setAddingToCartIds(prev => new Set(prev).add(item.productId));

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add to cart');
      }

      toast({ 
        title: 'Added to cart',
        description: item.product.name,
        variant: 'success',
      });
    } catch (error: any) {
      toast({ 
        title: 'Failed to add to cart',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAddingToCartIds(prev => {
        const next = new Set(prev);
        next.delete(item.productId);
        return next;
      });
    }
  };

  const handleMoveAllToCart = async () => {
    const availableItems = items.filter(item => item.product.available);
    
    if (availableItems.length === 0) {
      toast({ 
        title: 'No available items',
        description: 'All items in your wishlist are currently unavailable',
        variant: 'destructive',
      });
      return;
    }

    for (const item of availableItems) {
      await handleAddToCart(item);
    }
  };

  if (items.length === 0) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/50 py-20 text-center backdrop-blur-sm dark:bg-slate-800/50">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Your wishlist is empty
          </h3>
          <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">
            Start adding products you love to keep track of them and easily add them to your cart later.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            Browse Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Actions Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/50 p-4 backdrop-blur-sm dark:bg-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">{items.length}</span> items in your wishlist
        </p>
        <button
          onClick={handleMoveAllToCart}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90"
        >
          <ShoppingCart className="h-4 w-4" />
          Add All to Cart
        </button>
      </div>

      {/* Wishlist Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Product Image */}
              <Link href={`/product/${item.product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex flex-col gap-2">
                    {item.product.discount > 0 && (
                      <span className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        -{item.product.discount}%
                      </span>
                    )}
                    {item.product.freeShipping && (
                      <span className="rounded-lg bg-green-500 px-2 py-1 text-xs font-medium text-white">
                        Free Shipping
                      </span>
                    )}
                    {!item.product.available && (
                      <span className="rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/brands/${item.product.brand.slug}`}>
                  <p className="text-xs font-medium text-primary hover:underline">
                    {item.product.brand.name}
                  </p>
                </Link>
                
                <Link href={`/product/${item.product.slug}`}>
                  <h3 className="mt-1 font-medium text-slate-900 line-clamp-2 hover:text-primary dark:text-white">
                    {item.product.name}
                  </h3>
                </Link>

                {item.product.volumeMl && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.product.volumeMl}ml
                  </p>
                )}

                {/* Rating */}
                {item.product.reviewCount > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.product.avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({item.product.reviewCount})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-primary">
                    {formatPrice(item.product.price)}
                  </span>
                  {item.product.comparePrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatPrice(item.product.comparePrice)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.product.available || addingToCartIds.has(item.productId)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCartIds.has(item.productId) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : !item.product.available ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        Unavailable
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingIds.has(item.productId)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {removingIds.has(item.productId) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
