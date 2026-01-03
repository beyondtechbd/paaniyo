// components/product/ProductReviews.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Star,
  ThumbsUp,
  CheckCircle,
  ChevronDown,
  MessageSquare,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const sortOptions = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
];

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = async (resetPage = false) => {
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      
      const response = await fetch(
        `/api/reviews?productId=${productId}&sort=${sort}&page=${currentPage}&limit=5`
      );
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      
      if (resetPage || currentPage === 1) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReviews(true);
  }, [productId, sort]);

  const loadMore = () => {
    if (page < totalPages) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchReviews();
    }
  }, [page]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: formRating,
          title: formTitle.trim() || undefined,
          content: formContent.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted! It will appear after moderation.');
      setShowForm(false);
      setFormRating(5);
      setFormTitle('');
      setFormContent('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Stats Column */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Customer Reviews
            </h3>
            
            {stats && stats.totalReviews > 0 ? (
              <>
                {/* Average Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(stats.averageRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.distribution[rating as keyof typeof stats.distribution];
                    const percentage = stats.totalReviews > 0 
                      ? (count / stats.totalReviews) * 100 
                      : 0;

                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-3">
                          {rating}
                        </span>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: (5 - rating) * 0.1 }}
                            className="h-full bg-amber-400 rounded-full"
                          />
                        </div>
                        <span className="text-sm text-slate-500 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">No reviews yet</p>
              </div>
            )}

            {/* Write Review Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full mt-6 py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Write a Review
            </button>
          </div>
        </div>

        {/* Reviews Column */}
        <div className="flex-1">
          {/* Review Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={submitReview}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm mb-6"
                >
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Write Your Review
                  </h4>
                  
                  <p className="text-sm text-slate-500 mb-4">
                    Reviewing: <span className="font-medium text-slate-700 dark:text-slate-300">{productName}</span>
                  </p>

                  {/* Rating Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (hoverRating || formRating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-slate-500">
                        {formRating === 5 && 'Excellent'}
                        {formRating === 4 && 'Good'}
                        {formRating === 3 && 'Average'}
                        {formRating === 2 && 'Fair'}
                        {formRating === 1 && 'Poor'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Review Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      maxLength={100}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your Review (Optional)
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      maxLength={2000}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                    <p className="text-xs text-slate-500 text-right mt-1">
                      {formContent.length}/2000
                    </p>
                  </div>

                  {/* Notice */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Your review will be published after moderation. Reviews from verified purchases get a special badge.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-600 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sort & Filter */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">
                {stats?.totalReviews || 0} reviews
              </span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {review.user.image ? (
                          <Image
                            src={review.user.image}
                            alt={review.user.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {review.user.name}
                          </span>
                          {review.isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  {review.title && (
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                      {review.title}
                    </h4>
                  )}
                  
                  {review.content && (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {review.content}
                    </p>
                  )}

                  {!review.title && !review.content && (
                    <p className="text-slate-400 italic">
                      No written review provided
                    </p>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl">
                <MessageSquare className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No reviews yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Be the first to review this product!
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Write a Review
                </button>
              </div>
            )}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More Reviews
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
