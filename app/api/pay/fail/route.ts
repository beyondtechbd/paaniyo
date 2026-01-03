// app/api/pay/fail/route.ts
// Payment Failure Handler

import { NextRequest, NextResponse } from 'next/server';
import { processFailedPayment } from '@/lib/sslcommerz';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get('tran_id')?.toString();
    const failedReason = formData.get('error')?.toString();

    if (tranId) {
      await processFailedPayment(tranId, failedReason || 'Payment failed');
    }

    // Redirect to checkout with error message
    const redirectUrl = new URL('/checkout', request.url);
    redirectUrl.searchParams.set('error', 'payment_failed');
    if (failedReason) {
      redirectUrl.searchParams.set('reason', failedReason);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Payment fail handler error:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=server_error', request.url)
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url));
}
