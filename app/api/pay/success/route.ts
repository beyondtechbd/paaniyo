// app/api/pay/success/route.ts
// Payment Success Redirect Handler

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTransaction, processSuccessfulPayment } from '@/lib/sslcommerz';
import { OrderStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get('tran_id')?.toString();
    const valId = formData.get('val_id')?.toString();
    const amount = formData.get('amount')?.toString();
    const cardType = formData.get('card_type')?.toString();

    if (!tranId || !valId) {
      return NextResponse.redirect(
        new URL('/checkout/error?reason=missing_data', request.url)
      );
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { sslTranId: tranId },
    });

    if (!order) {
      return NextResponse.redirect(
        new URL('/checkout/error?reason=order_not_found', request.url)
      );
    }

    // If already processed by IPN, just redirect
    if (order.status === OrderStatus.PAID) {
      return NextResponse.redirect(
        new URL(`/orders/${order.id}/success`, request.url)
      );
    }

    // Validate with SSLCommerz (double-check)
    const validation = await validateTransaction(valId);

    if (validation.validated && amount) {
      await processSuccessfulPayment(
        tranId,
        valId,
        cardType || 'Unknown',
        amount
      );

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cart: { userId: order.userId } },
      });

      return NextResponse.redirect(
        new URL(`/orders/${order.id}/success`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/checkout/error?reason=validation_failed', request.url)
    );
  } catch (error) {
    console.error('Payment success handler error:', error);
    return NextResponse.redirect(
      new URL('/checkout/error?reason=server_error', request.url)
    );
  }
}

// Also handle GET for direct access
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/orders', request.url));
}
