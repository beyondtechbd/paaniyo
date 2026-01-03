'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isApproved: boolean;
  isRejected?: boolean;
  rejectionReason?: string | null;
  isVerifiedPurchase?: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    brand: {
      id: string;
      name: string;
    } | null;
  };
}

interface ReviewsClientProps {
  initialCounts: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export default function ReviewsClient({ initialCounts }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchReviews = useCallback(async () => {
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
      if (ratingFilter) {
        params.set('rating', ratingFilter.toString());
      }

      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReviews(data.reviews);
        setTotalPages(data.pagination.pages);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('error', 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, ratingFilter, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, ratingFilter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (reviewId: string, action: 'approve' | 'reject' | 'pending', reason?: string) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        showToast('success', `Review ${action}d successfully`);
        fetchReviews();
        setShowDetailModal(false);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const data = await res.json();
        showToast('error', data.error || `Failed to ${action} review`);
      }
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
      showToast('error', `Failed to ${action} review`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('success', 'Review deleted successfully');
        fetchReviews();
        setShowDetailModal(false);
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showToast('error', 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Reviews', count: counts.total },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ] as const;

  const getStatusBadge = (review: Review) => {
    if (review.isApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (review.isRejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Review Moderation</h1>
        <p className="text-white/60 mt-1">Approve or reject customer reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.pending}</p>
              <p className="text-sm text-white/60">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.approved}</p>
              <p className="text-sm text-white/60">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.rejected}</p>
              <p className="text-sm text-white/60">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.total}</p>
              <p className="text-sm text-white/60">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>

        {/* Rating Filter */}
        <select
          value={ratingFilter || ''}
          onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>
      </div>

      {/* Reviews List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                    <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {review.product.images[0] ? (
                        <Image
                          src={review.product.images[0]}
                          alt={review.product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{review.product.name}</p>
                      {review.product.brand && (
                        <p className="text-xs text-white/40">{review.product.brand.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      {getStatusBadge(review)}
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <p className="text-white font-medium mb-1">{review.title}</p>
                    )}
                    <p className="text-white/70 text-sm line-clamp-2">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span>{review.user.name || review.user.email}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.isRejected && review.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded-lg">
                        <p className="text-xs text-red-400">
                          <span className="font-medium">Rejection reason:</span> {review.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!review.isApproved && !review.isRejected && (
                      <>
                        <button
                          onClick={() => handleAction(review.id, 'approve')}
                          disabled={actionLoading === review.id}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === review.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowRejectModal(true);
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(review.isApproved || review.isRejected) && (
                      <button
                        onClick={() => handleAction(review.id, 'pending')}
                        disabled={actionLoading === review.id}
                        className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Reset to Pending"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-white/60 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Review Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Product */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden">
                    {selectedReview.product.images[0] ? (
                      <Image
                        src={selectedReview.product.images[0]}
                        alt={selectedReview.product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedReview.product.name}</p>
                    {selectedReview.product.brand && (
                      <p className="text-sm text-white/60">{selectedReview.product.brand.name}</p>
                    )}
                  </div>
                </div>

                {/* Reviewer */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {(selectedReview.user.name || selectedReview.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedReview.user.name || 'Anonymous'}</p>
                    <p className="text-sm text-white/60">{selectedReview.user.email}</p>
                  </div>
                </div>

                {/* Rating & Status */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {renderStars(selectedReview.rating)}
                  {getStatusBadge(selectedReview)}
                  {selectedReview.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <div className="space-y-3 mb-4">
                  {selectedReview.title && (
                    <p className="text-white font-semibold text-lg">{selectedReview.title}</p>
                  )}
                  <p className="text-white/80 whitespace-pre-wrap">{selectedReview.comment}</p>
                  <p className="text-sm text-white/40">
                    Submitted on {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Rejection Reason */}
                {selectedReview.isRejected && selectedReview.rejectionReason && (
                  <div className="p-3 bg-red-500/10 rounded-xl mb-4 border border-red-500/20">
                    <p className="text-sm text-red-400">
                      <span className="font-medium">Rejection reason:</span><br />
                      {selectedReview.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  {!selectedReview.isApproved && !selectedReview.isRejected && (
                    <>
                      <button
                        onClick={() => handleAction(selectedReview.id, 'approve')}
                        disabled={actionLoading === selectedReview.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === selectedReview.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {(selectedReview.isApproved || selectedReview.isRejected) && (
                    <button
                      onClick={() => handleAction(selectedReview.id, 'pending')}
                      disabled={actionLoading === selectedReview.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Pending
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedReview.id)}
                    disabled={actionLoading === selectedReview.id}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Reject Review</h3>
                </div>

                <p className="text-white/60 mb-4">
                  Are you sure you want to reject this review? You can optionally provide a reason.
                </p>

                <div className="mb-4">
                  <label className="block text-sm text-white/60 mb-2">Rejection Reason (optional)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Contains inappropriate language, spam, etc."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(selectedReview.id, 'reject', rejectionReason)}
                    disabled={actionLoading === selectedReview.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selectedReview.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Reject Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p>{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
