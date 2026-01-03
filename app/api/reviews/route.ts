// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RateLimitTier } from '@/lib/rate-limit';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

// GET - Fetch reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, highest, lowest, helpful

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build orderBy based on sort
    let orderBy: Record<string, 'asc' | 'desc'>[];
    switch (sort) {
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }];
        break;
      case 'highest':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'lowest':
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
        break;
      default: // newest
        orderBy = [{ createdAt: 'desc' }];
    }

    const [reviews, total, ratingStats] = await Promise.all([
      // Fetch paginated reviews
      prisma.review.findMany({
        where: {
          productId,
          isApproved: true,
        },
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),

      // Total count
      prisma.review.count({
        where: {
          productId,
          isApproved: true,
        },
      }),

      // Rating statistics
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId,
          isApproved: true,
        },
        _count: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    let totalRatings = 0;
    let ratingSum = 0;

    ratingStats.forEach((stat) => {
      ratingDistribution[stat.rating as keyof typeof ratingDistribution] = stat._count.rating;
      totalRatings += stat._count.rating;
      ratingSum += stat.rating * stat._count.rating;
    });

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          name: review.user.name || 'Anonymous',
          image: review.user.image,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: totalRatings,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please login to submit a review' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitTier.AUTH);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, rating, title, content } = validation.data;
    const userId = session.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }

    // Check if user has purchased this product (for verified badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    // Sanitize inputs
    const sanitizedTitle = title ? DOMPurify.sanitize(title.trim()) : null;
    const sanitizedContent = content ? DOMPurify.sanitize(content.trim()) : null;

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: sanitizedTitle,
        content: sanitizedContent,
        isVerified: !!hasPurchased,
        isApproved: false, // Requires moderation
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Review submitted successfully. It will be visible after moderation.',
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        user: {
          name: review.user.name || 'Anonymous',
          image: review.user.image,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
