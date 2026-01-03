// components/product/ProductInfo.tsx
// Product Information Panel with Pricing and Cart Actions

'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Check,
  AlertCircle,
  Package,
  Clock,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProductSpecs {
  volume?: string;
  packSize?: number;
  dimensions?: string;
  weight?: string;
  material?: string;
  origin?: string;
}

interface ShippingInfo {
  dhaka: { days: string; cost: number; freeThreshold: number };
  chittagong: { days: string; cost: number; freeThreshold: number };
  nationwide: { days: string; cost: number; freeThreshold: number };
}

interface ProductInfoProps {
  id: string;
  name: string;
  brand: string;
  description: string;
  priceBDT: number;
  comparePriceBDT?: number;
  sku: string;
  stock: number;
  specs?: ProductSpecs;
  shipping?: ShippingInfo;
  locale?: 'en' | 'bn';
  className?: string;
}

const defaultShipping: ShippingInfo = {
  dhaka: { days: '1', cost: 0, freeThreshold: 2000 },
  chittagong: { days: '2', cost: 80, freeThreshold: 3000 },
  nationwide: { days: '2-3', cost: 120, freeThreshold: 5000 },
};

export function ProductInfo({
  id,
  name,
  brand,
  description,
  priceBDT,
  comparePriceBDT,
  sku,
  stock,
  specs,
  shipping = defaultShipping,
  locale = 'en',
  className = '',
}: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const discount = comparePriceBDT
    ? Math.round(((comparePriceBDT - priceBDT) / comparePriceBDT) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, quantity }),
        });

        if (!response.ok) throw new Error('Failed to add to cart');

        toast({
          title: locale === 'bn' ? 'কার্টে যোগ করা হয়েছে' : 'Added to cart',
          description: `${quantity}x ${name}`,
        });
      } catch {
        toast({
          title: locale === 'bn' ? 'ত্রুটি' : 'Error',
          description:
            locale === 'bn'
              ? 'কার্টে যোগ করতে সমস্যা হয়েছে'
              : 'Failed to add to cart',
          variant: 'destructive',
        });
      }
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted
        ? locale === 'bn'
          ? 'উইশলিস্ট থেকে সরানো হয়েছে'
          : 'Removed from wishlist'
        : locale === 'bn'
          ? 'উইশলিস্টে যোগ করা হয়েছে'
          : 'Added to wishlist',
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: name,
        text: description,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: locale === 'bn' ? 'লিঙ্ক কপি করা হয়েছে' : 'Link copied',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn('space-y-6', className)}
    >
      {/* Brand & Name */}
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          {brand}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-4xl">
          {name}
        </h1>
      </div>

      {/* Description */}
      <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>

      {/* Pricing */}
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {formatPrice(priceBDT)}
        </span>
        {comparePriceBDT && (
          <>
            <span className="text-lg text-slate-400 line-through">
              {formatPrice(comparePriceBDT)}
            </span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-sm font-bold text-white"
            >
              -{discount}%
            </motion.span>
          </>
        )}
      </div>

      {/* VAT Notice */}
      <p className="text-xs text-slate-500">
        {locale === 'bn'
          ? 'সকল মূল্যে ১৫% ভ্যাট অন্তর্ভুক্ত'
          : 'All prices include 15% VAT'}
      </p>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {stock > 0 ? (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-3 w-3 text-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {locale === 'bn' ? 'স্টকে আছে' : 'In Stock'}
              <span className="ml-1 text-slate-400">
                ({stock} {locale === 'bn' ? 'টি' : 'units'})
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10">
              <AlertCircle className="h-3 w-3 text-rose-500" />
            </span>
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {locale === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          </>
        )}
      </div>

      {/* SKU */}
      <p className="text-xs text-slate-400">
        SKU: <span className="font-mono">{sku}</span>
      </p>

      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {locale === 'bn' ? 'পরিমাণ' : 'Quantity'}:
        </span>
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Minus className="h-4 w-4" />
          </motion.button>
          <span className="min-w-[3rem] text-center font-semibold text-slate-900 dark:text-white">
            {quantity}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
            className="flex h-10 w-10 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={stock === 0 || isPending}
          className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-500 hover:to-blue-500 hover:shadow-xl hover:shadow-cyan-500/30"
        >
          <ShoppingCart className="h-5 w-5" />
          {isPending
            ? locale === 'bn'
              ? 'যোগ হচ্ছে...'
              : 'Adding...'
            : locale === 'bn'
              ? 'কার্টে যোগ করুন'
              : 'Add to Cart'}
        </Button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWishlist}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl border transition-all',
            isWishlisted
              ? 'border-rose-500 bg-rose-500/10 text-rose-500'
              : 'border-slate-200 text-slate-600 hover:border-rose-500 hover:text-rose-500 dark:border-slate-700 dark:text-slate-400'
          )}
          aria-label="Add to wishlist"
        >
          <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-cyan-500 hover:text-cyan-500 dark:border-slate-700 dark:text-slate-400"
          aria-label="Share product"
        >
          <Share2 className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Quick Specs */}
      {specs && (
        <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Package className="h-4 w-4" />
            {locale === 'bn' ? 'স্পেসিফিকেশন' : 'Quick Specs'}
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {specs.volume && (
              <div>
                <dt className="text-slate-500">
                  {locale === 'bn' ? 'আয়তন' : 'Volume'}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {specs.volume}
                </dd>
              </div>
            )}
            {specs.packSize && (
              <div>
                <dt className="text-slate-500">
                  {locale === 'bn' ? 'প্যাক সাইজ' : 'Pack Size'}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {specs.packSize} {locale === 'bn' ? 'টি' : 'units'}
                </dd>
              </div>
            )}
            {specs.material && (
              <div>
                <dt className="text-slate-500">
                  {locale === 'bn' ? 'বোতল' : 'Bottle'}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {specs.material}
                </dd>
              </div>
            )}
            {specs.origin && (
              <div>
                <dt className="text-slate-500">
                  {locale === 'bn' ? 'উৎপত্তি' : 'Origin'}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {specs.origin}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Shipping Info */}
      <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 dark:border-slate-700/50 dark:from-cyan-950/30 dark:to-blue-950/30">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Clock className="h-4 w-4" />
          {locale === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Info'}
        </h3>
        <ul className="space-y-2 text-sm">
          {Object.entries(shipping).map(([zone, info]) => (
            <li key={zone} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="h-3 w-3" />
                {zone === 'dhaka'
                  ? locale === 'bn'
                    ? 'ঢাকা মেট্রো'
                    : 'Dhaka Metro'
                  : zone === 'chittagong'
                    ? locale === 'bn'
                      ? 'চট্টগ্রাম'
                      : 'Chittagong'
                    : locale === 'bn'
                      ? 'সারাদেশ'
                      : 'Nationwide'}
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {info.days} {locale === 'bn' ? 'দিন' : 'day(s)'}
                {info.cost === 0 || priceBDT >= info.freeThreshold ? (
                  <span className="ml-2 text-emerald-500">
                    ({locale === 'bn' ? 'বিনামূল্যে' : 'Free'})
                  </span>
                ) : (
                  <span className="ml-2 text-slate-400">
                    ({formatPrice(info.cost)})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default ProductInfo;
