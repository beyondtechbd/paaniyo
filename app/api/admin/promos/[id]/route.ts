import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import DOMPurify from 'isomorphic-dompurify';

// GET /api/admin/promos/[id] - Get single promo code details
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


    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            discount: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }

    // Calculate total discount given
    const totalDiscount = await prisma.order.aggregate({
      where: { promoCodeId: id },
      _sum: { discount: true },
    });

    return NextResponse.json({
      promoCode: {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minOrderBDT: promoCode.minOrderBDT ? Number(promoCode.minOrderBDT) : null,
        maxDiscountBDT: promoCode.maxDiscountBDT ? Number(promoCode.maxDiscountBDT) : null,
        ordersCount: promoCode._count.orders,
        totalDiscountGiven: totalDiscount._sum.discount ? Number(totalDiscount._sum.discount) : 0,
        orders: promoCode.orders.map((o) => ({
          ...o,
          total: Number(o.total),
          discount: Number(o.discount),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching promo code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo code' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/promos/[id] - Update promo code
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
      isActive,
    } = body;

    // Find existing promo code
    const existingPromo = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existingPromo) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Update code if provided
    if (code !== undefined) {
      const sanitizedCode = DOMPurify.sanitize(code).toUpperCase().trim();
      if (sanitizedCode.length < 3 || sanitizedCode.length > 20) {
        return NextResponse.json(
          { error: 'Code must be 3-20 characters' },
          { status: 400 }
        );
      }

      // Check for duplicate
      if (sanitizedCode !== existingPromo.code) {
        const duplicate = await prisma.promoCode.findUnique({
          where: { code: sanitizedCode },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: 'Promo code already exists' },
            { status: 400 }
          );
        }
      }
      updateData.code = sanitizedCode;
    }

    // Update description
    if (description !== undefined) {
      updateData.description = description ? DOMPurify.sanitize(description) : null;
    }

    // Update discount type and value
    if (discountType !== undefined) {
      if (!['percentage', 'fixed'].includes(discountType)) {
        return NextResponse.json(
          { error: 'Discount type must be percentage or fixed' },
          { status: 400 }
        );
      }
      updateData.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const numDiscountValue = parseFloat(discountValue);
      if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
        return NextResponse.json(
          { error: 'Discount value must be a positive number' },
          { status: 400 }
        );
      }
      const type = discountType || existingPromo.discountType;
      if (type === 'percentage' && numDiscountValue > 100) {
        return NextResponse.json(
          { error: 'Percentage discount cannot exceed 100%' },
          { status: 400 }
        );
      }
      updateData.discountValue = numDiscountValue;
    }

    // Update limits
    if (minOrderBDT !== undefined) {
      updateData.minOrderBDT = minOrderBDT ? parseFloat(minOrderBDT) : null;
    }
    if (maxDiscountBDT !== undefined) {
      updateData.maxDiscountBDT = maxDiscountBDT ? parseFloat(maxDiscountBDT) : null;
    }
    if (usageLimit !== undefined) {
      updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    }
    if (perUserLimit !== undefined) {
      updateData.perUserLimit = perUserLimit ? parseInt(perUserLimit) : 1;
    }

    // Update dates
    if (startsAt !== undefined) {
      if (startsAt) {
        const parsedStartsAt = new Date(startsAt);
        if (isNaN(parsedStartsAt.getTime())) {
          return NextResponse.json(
            { error: 'Invalid start date' },
            { status: 400 }
          );
        }
        updateData.startsAt = parsedStartsAt;
      } else {
        updateData.startsAt = null;
      }
    }

    if (expiresAt !== undefined) {
      if (expiresAt) {
        const parsedExpiresAt = new Date(expiresAt);
        if (isNaN(parsedExpiresAt.getTime())) {
          return NextResponse.json(
            { error: 'Invalid expiry date' },
            { status: 400 }
          );
        }
        updateData.expiresAt = parsedExpiresAt;
      } else {
        updateData.expiresAt = null;
      }
    }

    // Update active status
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Update the promo code
    const updatedPromo = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    console.log(`Admin ${session.user.email} updated promo code ${id}:`, updateData);

    return NextResponse.json({
      promoCode: {
        ...updatedPromo,
        discountValue: Number(updatedPromo.discountValue),
        minOrderBDT: updatedPromo.minOrderBDT ? Number(updatedPromo.minOrderBDT) : null,
        maxDiscountBDT: updatedPromo.maxDiscountBDT ? Number(updatedPromo.maxDiscountBDT) : null,
      },
      message: 'Promo code updated successfully',
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promos/[id] - Delete promo code
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


    // Check if promo code exists
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      );
    }

    // If promo code has been used, just deactivate instead of delete
    if (promoCode._count.orders > 0) {
      await prisma.promoCode.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: 'Promo code has been used - deactivated instead of deleted',
      });
    }

    // Delete the promo code
    await prisma.promoCode.delete({
      where: { id },
    });

    console.log(`Admin ${session.user.email} deleted promo code ${id}`);

    return NextResponse.json({
      message: 'Promo code deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
