import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import DOMPurify from 'isomorphic-dompurify';

// GET /api/admin/promos - List promo codes with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, inactive, expired
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const now = new Date();

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ];
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'expired') {
      where.expiresAt = { lt: now };
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch promo codes
    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ]);

    // Get counts
    const [activeCount, inactiveCount, expiredCount] = await Promise.all([
      prisma.promoCode.count({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      }),
      prisma.promoCode.count({ where: { isActive: false } }),
      prisma.promoCode.count({ where: { expiresAt: { lt: now } } }),
    ]);

    // Calculate stats
    const totalUsage = promoCodes.reduce((sum, p) => sum + p.usageCount, 0);

    return NextResponse.json({
      promoCodes: promoCodes.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
        minOrderBDT: p.minOrderBDT ? Number(p.minOrderBDT) : null,
        maxDiscountBDT: p.maxDiscountBDT ? Number(p.maxDiscountBDT) : null,
        ordersCount: p._count.orders,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      counts: {
        active: activeCount,
        inactive: inactiveCount,
        expired: expiredCount,
        total: activeCount + inactiveCount,
      },
      stats: {
        totalUsage,
      },
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/promos - Create new promo code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderBDT,
      maxDiscountBDT,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
    } = body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Validate code format
    const sanitizedCode = DOMPurify.sanitize(code).toUpperCase().trim();
    if (sanitizedCode.length < 3 || sanitizedCode.length > 20) {
      return NextResponse.json(
        { error: 'Code must be 3-20 characters' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: sanitizedCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Discount type must be percentage or fixed' },
        { status: 400 }
      );
    }

    // Validate discount value
    const numDiscountValue = parseFloat(discountValue);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be a positive number' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && numDiscountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Validate dates
    let parsedStartsAt = null;
    let parsedExpiresAt = null;

    if (startsAt) {
      parsedStartsAt = new Date(startsAt);
      if (isNaN(parsedStartsAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date' },
          { status: 400 }
        );
      }
    }

    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiry date' },
          { status: 400 }
        );
      }

      if (parsedStartsAt && parsedExpiresAt <= parsedStartsAt) {
        return NextResponse.json(
          { error: 'Expiry date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Create promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code: sanitizedCode,
        description: description ? DOMPurify.sanitize(description) : null,
        discountType,
        discountValue: numDiscountValue,
        minOrderBDT: minOrderBDT ? parseFloat(minOrderBDT) : null,
        maxDiscountBDT: maxDiscountBDT ? parseFloat(maxDiscountBDT) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        startsAt: parsedStartsAt,
        expiresAt: parsedExpiresAt,
        isActive: true,
      },
    });

    console.log(`Admin ${session.user.email} created promo code: ${sanitizedCode}`);

    return NextResponse.json({
      promoCode: {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minOrderBDT: promoCode.minOrderBDT ? Number(promoCode.minOrderBDT) : null,
        maxDiscountBDT: promoCode.maxDiscountBDT ? Number(promoCode.maxDiscountBDT) : null,
      },
      message: 'Promo code created successfully',
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}
