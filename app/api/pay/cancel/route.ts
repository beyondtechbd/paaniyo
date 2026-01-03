// app/api/pay/cancel/route.ts
// Payment Cancellation Handler

import { NextRequest, NextResponse } from 'next/server';
import { processFailedPayment } from '@/lib/sslcommerz';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get('tran_id')?.toString();

    if (tranId) {
      await processFailedPayment(tranId, 'Cancelled by user');
    }

    // Redirect to cart
    return NextResponse.redirect(new URL('/cart?cancelled=true', request.url));
  } catch (error) {
    console.error('Payment cancel handler error:', error);
    return NextResponse.redirect(new URL('/cart', request.url));
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/cart?cancelled=true', request.url));
}
