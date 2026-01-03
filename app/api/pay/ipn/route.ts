// app/api/pay/ipn/route.ts
// SSLCommerz IPN (Instant Payment Notification) Handler
// This is the most secure way to handle payment confirmations

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyIPNSignature,
  validateTransaction,
  processSuccessfulPayment,
  processFailedPayment,
  type IPNPayload,
} from '@/lib/sslcommerz';
import { prisma } from '@/lib/prisma';

// SSLCommerz sends IPN as POST with form data
export async function POST(request: NextRequest) {
  try {
    // Parse form data from SSLCommerz
    const formData = await request.formData();
    const payload: Record<string, string> = {};

    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const ipnData = payload as unknown as IPNPayload;

    // Log for debugging (remove in production)
    console.log('IPN Received:', {
      tran_id: ipnData.tran_id,
      status: ipnData.status,
      amount: ipnData.amount,
    });

    // Verify IPN signature to prevent tampering
    const isValidSignature = verifyIPNSignature(ipnData);
    if (!isValidSignature) {
      console.error('IPN signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { sslTranId: ipnData.tran_id },
    });

    if (!order) {
      console.error('Order not found for tran_id:', ipnData.tran_id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate with SSLCommerz server
    const validation = await validateTransaction(ipnData.val_id);

    if (!validation.validated) {
      console.error('Transaction validation failed:', validation);
      await processFailedPayment(ipnData.tran_id, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      );
    }

    // Check status
    if (ipnData.status === 'VALID' || ipnData.status === 'VALIDATED') {
      // Verify amount matches
      const expectedAmount = Number(order.totalBDT);
      const receivedAmount = parseFloat(ipnData.amount);

      if (Math.abs(expectedAmount - receivedAmount) > 1) {
        // Allow ৳1 tolerance for rounding
        console.error('Amount mismatch:', { expectedAmount, receivedAmount });
        await processFailedPayment(ipnData.tran_id, 'Amount mismatch');
        return NextResponse.json(
          { error: 'Amount mismatch' },
          { status: 400 }
        );
      }

      // Process successful payment
      await processSuccessfulPayment(
        ipnData.tran_id,
        ipnData.val_id,
        ipnData.card_type || 'Unknown',
        ipnData.amount
      );

      // Clear user's cart
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: order.userId,
          },
        },
      });

      return NextResponse.json({ status: 'success' });
    } else if (ipnData.status === 'FAILED') {
      await processFailedPayment(ipnData.tran_id, 'Payment failed by gateway');
      return NextResponse.json({ status: 'failed' });
    } else if (ipnData.status === 'CANCELLED') {
      await processFailedPayment(ipnData.tran_id, 'Payment cancelled by user');
      return NextResponse.json({ status: 'cancelled' });
    }

    // Unknown status
    return NextResponse.json(
      { error: 'Unknown payment status' },
      { status: 400 }
    );
  } catch (error) {
    console.error('IPN processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// SSLCommerz may also send GET requests for verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tranId = searchParams.get('tran_id');

  if (!tranId) {
    return NextResponse.json(
      { error: 'Transaction ID required' },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { sslTranId: tranId },
    select: {
      id: true,
      orderNo: true,
      status: true,
      totalBDT: true,
      paidAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paid: order.paidAt !== null,
  });
}
