// app/api/pay/init/route.ts
// Payment Initialization API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initializePayment } from '@/lib/sslcommerz';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { OrderStatus } from '@prisma/client';

// Request validation schema
const initPaymentSchema = z.object({
  addressId: z.string().cuid(),
  promoCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// VAT rate (15% for Bangladesh)
const VAT_RATE = 0.15;

// Shipping zones configuration
const SHIPPING_ZONES: Record<
  string,
  { cost: number; freeAbove: number; days: number }
> = {
  dhaka: { cost: 0, freeAbove: 2000, days: 1 },
  chittagong: { cost: 80, freeAbove: 3000, days: 2 },
  nationwide: { cost: 120, freeAbove: 5000, days: 3 },
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'payment');
    if (rateLimit && !rateLimit.success) {
      return createRateLimitResponse(rateLimit.reset);
    }

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please login to continue' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = initPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { addressId, promoCode, notes } = validation.data;

    // Fetch user's cart with products
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Empty Cart', message: 'Your cart is empty' },
        { status: 400 }
      );
    }

    // Verify stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: 'Stock Error',
            message: `${item.product.name} is out of stock or has insufficient quantity`,
            productId: item.productId,
          },
          { status: 400 }
        );
      }
    }

    // Fetch shipping address
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address Error', message: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotalBDT = 0;
    const productNames: string[] = [];
    const productCategories: string[] = [];

    for (const item of cart.items) {
      const itemTotal = Number(item.product.priceBDT) * item.quantity;
      subtotalBDT += itemTotal;
      productNames.push(item.product.name);
      productCategories.push(item.product.category);
    }

    // Determine shipping zone and cost
    const city = address.city.toLowerCase();
    let shippingZone = 'nationwide';
    if (city.includes('dhaka')) {
      shippingZone = 'dhaka';
    } else if (city.includes('chittagong') || city.includes('chattogram')) {
      shippingZone = 'chittagong';
    }

    const zoneConfig = SHIPPING_ZONES[shippingZone];
    let shippingBDT =
      subtotalBDT >= zoneConfig.freeAbove ? 0 : zoneConfig.cost;

    // Check for free shipping products
    const hasFreeShippingProduct = cart.items.some(
      (item) => item.product.freeShipping
    );
    if (hasFreeShippingProduct) {
      shippingBDT = 0;
    }

    // Apply promo code
    let discountBDT = 0;
    let appliedPromo = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: promoCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (promo) {
        // Check usage limits
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
          return NextResponse.json(
            { error: 'Promo Error', message: 'Promo code usage limit reached' },
            { status: 400 }
          );
        }

        // Check minimum order
        if (promo.minOrderBDT && subtotalBDT < Number(promo.minOrderBDT)) {
          return NextResponse.json(
            {
              error: 'Promo Error',
              message: `Minimum order of ৳${promo.minOrderBDT} required`,
            },
            { status: 400 }
          );
        }

        // Calculate discount
        if (promo.discountType === 'percentage') {
          discountBDT = (subtotalBDT * Number(promo.discountValue)) / 100;
        } else {
          discountBDT = Number(promo.discountValue);
        }

        // Apply max discount cap
        if (promo.maxDiscountBDT) {
          discountBDT = Math.min(discountBDT, Number(promo.maxDiscountBDT));
        }

        appliedPromo = promo;
      }
    }

    // Calculate VAT
    const taxableAmount = subtotalBDT - discountBDT;
    const vatBDT = taxableAmount * VAT_RATE;

    // Calculate total
    const totalBDT = taxableAmount + vatBDT + shippingBDT;

    // Calculate commission (average across items)
    const commissionBDT = totalBDT * 0.12; // 12% platform commission

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: OrderStatus.PENDING,
        subtotalBDT,
        shippingBDT,
        vatBDT,
        discountBDT,
        totalBDT,
        commissionBDT,
        shippingAddressId: addressId,
        shippingZone,
        customerNote: notes,
        promoCode: appliedPromo?.code,
        promoId: appliedPromo?.id,
        estimatedDelivery: new Date(
          Date.now() + zoneConfig.days * 24 * 60 * 60 * 1000
        ),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage:
              (item.product.images as string[])?.[0] || null,
            brandName: item.product.brand.name,
            unitPriceBDT: item.product.priceBDT,
            quantity: item.quantity,
            totalBDT: Number(item.product.priceBDT) * item.quantity,
            vendorId: item.product.brand.vendorId,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            note: 'Order created, awaiting payment',
          },
        },
      },
    });

    // Update promo usage count
    if (appliedPromo) {
      await prisma.promoCode.update({
        where: { id: appliedPromo.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Initialize SSLCommerz payment
    const gatewayUrl = await initializePayment({
      orderId: order.id,
      totalBDT: Number(totalBDT),
      customerName: address.fullName,
      customerEmail: session.user.email,
      customerPhone: address.phone,
      customerAddress: `${address.address1}${address.address2 ? ', ' + address.address2 : ''}`,
      customerCity: address.city,
      customerPostcode: address.postCode || undefined,
      productNames,
      productCategories,
    });

    // Return gateway URL for redirect
    return NextResponse.json({
      success: true,
      gatewayUrl,
      orderId: order.id,
      orderNo: order.orderNo,
      summary: {
        subtotal: Number(subtotalBDT).toFixed(2),
        shipping: Number(shippingBDT).toFixed(2),
        discount: Number(discountBDT).toFixed(2),
        vat: Number(vatBDT).toFixed(2),
        total: Number(totalBDT).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Payment initialization error:', error);

    return NextResponse.json(
      {
        error: 'Payment Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize payment',
      },
      { status: 500 }
    );
  }
}
