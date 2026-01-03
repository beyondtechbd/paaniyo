import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reviews/[id] - Get single review details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if this is a verified purchase
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        order: { userId: review.userId },
        productId: review.productId,
        status: 'DELIVERED',
      },
    });

    return NextResponse.json({
      review: {
        ...review,
        isVerifiedPurchase: !!orderItem,
      },
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews/[id] - Update review (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    // Validate action
    if (!['approve', 'reject', 'pending'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or pending.' },
        { status: 400 }
      );
    }

    // Find the review
    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        product: { select: { name: true } },
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Build update data
    let updateData: {
      isApproved: boolean;
      isRejected?: boolean;
      rejectionReason?: string | null;
    };

    if (action === 'approve') {
      updateData = {
        isApproved: true,
        isRejected: false,
        rejectionReason: null,
      };
    } else if (action === 'reject') {
      updateData = {
        isApproved: false,
        isRejected: true,
        rejectionReason: rejectionReason || null,
      };
    } else {
      // Reset to pending
      updateData = {
        isApproved: false,
        isRejected: false,
        rejectionReason: null,
      };
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // If approved, update product rating
    if (action === 'approve') {
      await updateProductRating(existingReview.productId);
    }

    // Log the action
    console.log(`Admin ${session.user.email} ${action}d review ${id}:`, {
      product: existingReview.product.name,
      reviewer: existingReview.user.name,
      rating: existingReview.rating,
      rejectionReason,
    });

    // TODO: Send email notification to reviewer about status
    // if (action === 'reject' && rejectionReason) {
    //   await sendReviewRejectionEmail(existingReview.user.email, rejectionReason);
    // }

    return NextResponse.json({
      review: updatedReview,
      message: `Review ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Find the review
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const productId = review.productId;

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    // Update product rating
    await updateProductRating(productId);

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

// Helper function to update product rating after review changes
async function updateProductRating(productId: string) {
  const approvedReviews = await prisma.review.findMany({
    where: {
      productId,
      isApproved: true,
    },
    select: { rating: true },
  });

  if (approvedReviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: 0,
        reviewCount: 0,
      },
    });
  } else {
    const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: approvedReviews.length,
      },
    });
  }
}
