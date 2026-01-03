import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import ReviewsClient from '@/components/admin/ReviewsClient';

export const metadata: Metadata = {
  title: 'Review Moderation - Admin | Paaniyo',
  description: 'Moderate customer reviews',
};

export default async function AdminReviewsPage() {
  // Get initial counts
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.review.count({ where: { isApproved: false, isRejected: { not: true } } }),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.count({ where: { isRejected: true } }),
  ]);

  return (
    <ReviewsClient
      initialCounts={{
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      }}
    />
  );
}
