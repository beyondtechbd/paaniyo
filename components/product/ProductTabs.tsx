// components/product/ProductTabs.tsx
// Collapsible Product Tabs with Premium Animations

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Box, Truck, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

interface ProductTabsProps {
  longDescription?: string;
  specifications?: Record<string, string | number>;
  shippingNotes?: string[];
  sustainabilityNotes?: string[];
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  locale?: 'en' | 'bn';
  className?: string;
}

const tabConfig = [
  { id: 'info', icon: FileText, labelEn: 'Information', labelBn: 'তথ্য' },
  { id: 'specs', icon: Box, labelEn: 'Specifications', labelBn: 'স্পেসিফিকেশন' },
  { id: 'shipping', icon: Truck, labelEn: 'Shipping & Returns', labelBn: 'শিপিং ও রিটার্ন' },
  { id: 'reviews', icon: MessageSquare, labelEn: 'Reviews', labelBn: 'রিভিউ' },
];

export function ProductTabs({
  longDescription,
  specifications,
  shippingNotes,
  sustainabilityNotes,
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  locale = 'en',
  className = '',
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>('info');

  const toggleTab = (tabId: string) => {
    setActiveTab(activeTab === tabId ? null : tabId);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < rating
            ? 'fill-amber-400 text-amber-400'
            : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
        )}
      />
    ));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {tabConfig.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <motion.div
            key={tab.id}
            initial={false}
            className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/50 dark:bg-slate-900"
          >
            {/* Tab Header */}
            <motion.button
              onClick={() => toggleTab(tab.id)}
              className={cn(
                'flex w-full items-center justify-between px-6 py-4 text-left transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'font-semibold transition-colors',
                    isActive
                      ? 'text-cyan-700 dark:text-cyan-400'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  {locale === 'bn' ? tab.labelBn : tab.labelEn}
                  {tab.id === 'reviews' && totalReviews > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({totalReviews})
                    </span>
                  )}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isActive ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </motion.div>
            </motion.button>

            {/* Tab Content */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800">
                    {/* Information Tab */}
                    {tab.id === 'info' && (
                      <div className="space-y-4">
                        {longDescription ? (
                          <div
                            className="prose prose-slate max-w-none dark:prose-invert prose-p:text-slate-600 dark:prose-p:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: longDescription }}
                          />
                        ) : (
                          <p className="text-slate-500">
                            {locale === 'bn'
                              ? 'কোনো বিস্তারিত তথ্য নেই'
                              : 'No detailed information available'}
                          </p>
                        )}
                        {sustainabilityNotes && sustainabilityNotes.length > 0 && (
                          <div className="mt-6 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                            <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                              🌱{' '}
                              {locale === 'bn'
                                ? 'পরিবেশ বান্ধব'
                                : 'Sustainability'}
                            </h4>
                            <ul className="space-y-1 text-sm text-emerald-600 dark:text-emerald-300">
                              {sustainabilityNotes.map((note, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                                  {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Specifications Tab */}
                    {tab.id === 'specs' && (
                      <div>
                        {specifications &&
                        Object.keys(specifications).length > 0 ? (
                          <dl className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(specifications).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
                                >
                                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                    {key}
                                  </dt>
                                  <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                                    {value}
                                  </dd>
                                </div>
                              )
                            )}
                          </dl>
                        ) : (
                          <p className="text-slate-500">
                            {locale === 'bn'
                              ? 'কোনো স্পেসিফিকেশন নেই'
                              : 'No specifications available'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Shipping Tab */}
                    {tab.id === 'shipping' && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                            <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-400">
                              {locale === 'bn' ? 'ডেলিভারি' : 'Delivery'}
                            </h4>
                            <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-300">
                              <li>
                                •{' '}
                                {locale === 'bn'
                                  ? 'ঢাকায় ১ দিনে ডেলিভারি'
                                  : 'Dhaka: 1-day delivery'}
                              </li>
                              <li>
                                •{' '}
                                {locale === 'bn'
                                  ? 'চট্টগ্রামে ২ দিনে'
                                  : 'Chittagong: 2 days'}
                              </li>
                              <li>
                                •{' '}
                                {locale === 'bn'
                                  ? 'সারাদেশে ২-৩ দিনে'
                                  : 'Nationwide: 2-3 days'}
                              </li>
                            </ul>
                          </div>
                          <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30">
                            <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-400">
                              {locale === 'bn' ? 'রিটার্ন পলিসি' : 'Returns'}
                            </h4>
                            <p className="text-sm text-purple-600 dark:text-purple-300">
                              {locale === 'bn'
                                ? 'ক্ষতিগ্রস্ত বা ভুল পণ্যের জন্য ৭ দিনের মধ্যে রিটার্ন গ্রহণযোগ্য। সম্পূর্ণ রিফান্ড প্রযোজ্য।'
                                : '7-day returns for damaged or incorrect items. Full refund applicable.'}
                            </p>
                          </div>
                        </div>
                        {shippingNotes && shippingNotes.length > 0 && (
                          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
                            <h4 className="mb-2 font-semibold text-amber-700 dark:text-amber-400">
                              {locale === 'bn'
                                ? 'বিশেষ নির্দেশনা'
                                : 'Special Notes'}
                            </h4>
                            <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-300">
                              {shippingNotes.map((note, index) => (
                                <li key={index}>• {note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reviews Tab */}
                    {tab.id === 'reviews' && (
                      <div className="space-y-6">
                        {/* Rating Summary */}
                        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                          <div className="text-center">
                            <span className="text-4xl font-bold text-slate-900 dark:text-white">
                              {averageRating.toFixed(1)}
                            </span>
                            <div className="mt-1 flex">
                              {renderStars(Math.round(averageRating))}
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {locale === 'bn'
                              ? `${totalReviews} টি রিভিউ থেকে`
                              : `Based on ${totalReviews} reviews`}
                          </div>
                        </div>

                        {/* Reviews List */}
                        {reviews.length > 0 ? (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                                      {review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        {review.userName}
                                      </span>
                                      {review.verified && (
                                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                          {locale === 'bn'
                                            ? 'যাচাইকৃত'
                                            : 'Verified'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-slate-400">
                                    {review.date}
                                  </span>
                                </div>
                                <div className="mb-2 flex">
                                  {renderStars(review.rating)}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {review.comment}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <MessageSquare className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500">
                              {locale === 'bn'
                                ? 'এখনও কোনো রিভিউ নেই। প্রথম রিভিউ দিন!'
                                : 'No reviews yet. Be the first to review!'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ProductTabs;
