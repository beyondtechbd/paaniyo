// lib/sslcommerz.ts
// SSLCommerz Payment Gateway Integration for Bangladesh

import SSLCommerzPayment from 'sslcommerz-lts';
import { createHash } from 'crypto';
import { prisma } from './prisma';
import { OrderStatus } from '@prisma/client';

// Types
interface SSLCommerzConfig {
  store_id: string;
  store_passwd: string;
  is_live: boolean;
}

interface PaymentInitParams {
  orderId: string;
  totalBDT: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostcode?: string;
  productNames: string[];
  productCategories: string[];
}

interface IPNPayload {
  tran_id: string;
  val_id: string;
  amount: string;
  card_type: string;
  store_amount: string;
  card_no: string;
  bank_tran_id: string;
  status: string;
  tran_date: string;
  currency: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  verify_sign: string;
  verify_key: string;
  risk_level: string;
  risk_title: string;
}

interface ValidationResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  risk_level: string;
  risk_title: string;
  validated: boolean;
}

// Configuration
const config: SSLCommerzConfig = {
  store_id: process.env.SSL_STORE_ID!,
  store_passwd: process.env.SSL_STORE_PASSWORD!,
  is_live: process.env.SSL_IS_SANDBOX !== 'true',
};

// Initialize SSLCommerz instance
const sslcommerz = new SSLCommerzPayment(
  config.store_id,
  config.store_passwd,
  config.is_live
);

/**
 * Initialize a payment session
 * Returns the gateway page URL for redirect
 */
export async function initializePayment(params: PaymentInitParams): Promise<string> {
  const {
    orderId,
    totalBDT,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerCity,
    customerPostcode,
    productNames,
    productCategories,
  } = params;

  // Generate unique transaction ID
  const tranId = `paaniyo_${orderId}_${Date.now()}`;

  // Update order with transaction ID
  await prisma.order.update({
    where: { id: orderId },
    data: {
      sslTranId: tranId,
      status: OrderStatus.PAYMENT_INITIATED,
    },
  });

  // Prepare payment data
  const paymentData = {
    // Transaction Info
    total_amount: totalBDT,
    currency: 'BDT',
    tran_id: tranId,

    // URLs
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pay/success`,
    fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pay/fail`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pay/cancel`,
    ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pay/ipn`,

    // Customer Info
    cus_name: customerName,
    cus_email: customerEmail,
    cus_phone: customerPhone,
    cus_add1: customerAddress,
    cus_city: customerCity,
    cus_postcode: customerPostcode || '1000',
    cus_country: 'Bangladesh',

    // Shipping Info (same as customer for now)
    shipping_method: 'Courier',
    ship_name: customerName,
    ship_add1: customerAddress,
    ship_city: customerCity,
    ship_postcode: customerPostcode || '1000',
    ship_country: 'Bangladesh',

    // Product Info
    product_name: productNames.join(', ').slice(0, 256),
    product_category: productCategories[0] || 'Beverages',
    product_profile: 'physical-goods',

    // Optional: Custom values for reference
    value_a: orderId,
    value_b: 'paaniyo',
    value_c: new Date().toISOString(),
    value_d: '',

    // EMI Options (disabled for now)
    emi_option: 0,
    multi_card_name: '',
  };

  try {
    const response = await sslcommerz.init(paymentData);

    if (response.status === 'SUCCESS') {
      // Store session key for validation
      await prisma.order.update({
        where: { id: orderId },
        data: { sslSessionKey: response.sessionkey },
      });

      return response.GatewayPageURL;
    }

    throw new Error(response.failedreason || 'Payment initialization failed');
  } catch (error) {
    // Revert order status on failure
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PENDING },
    });

    throw error;
  }
}

/**
 * Verify IPN signature to prevent tampering
 */
export function verifyIPNSignature(payload: IPNPayload): boolean {
  const { verify_sign, verify_key } = payload;

  if (!verify_sign || !verify_key) {
    return false;
  }

  // Get keys in order
  const keys = verify_key.split(',');

  // Build string to hash
  let hashString = '';
  for (const key of keys) {
    const value = (payload as Record<string, string>)[key];
    if (value !== undefined) {
      hashString += `${key}=${value}&`;
    }
  }

  // Remove trailing &
  hashString = hashString.slice(0, -1);

  // Generate MD5 hash
  const computedHash = createHash('md5').update(hashString).digest('hex');

  return computedHash === verify_sign;
}

/**
 * Validate transaction with SSLCommerz server
 * This is the most secure way to verify payment
 */
export async function validateTransaction(valId: string): Promise<ValidationResponse> {
  try {
    const response = await sslcommerz.validate({ val_id: valId });
    return {
      ...response,
      validated: response.status === 'VALIDATED' || response.status === 'VALID',
    };
  } catch (error) {
    throw new Error('Transaction validation failed');
  }
}

/**
 * Process successful payment
 * Called after IPN validation
 */
export async function processSuccessfulPayment(
  tranId: string,
  valId: string,
  paymentMethod: string,
  amount: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { sslTranId: tranId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: {
                include: { vendor: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify amount matches
  const expectedAmount = Number(order.totalBDT);
  const receivedAmount = parseFloat(amount);

  if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
    throw new Error('Amount mismatch');
  }

  // Update order status
  await prisma.$transaction([
    // Update order
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        sslValId: valId,
        paymentMethod,
        paidAt: new Date(),
      },
    }),

    // Add status history
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.PAID,
        note: `Payment received via ${paymentMethod}`,
      },
    }),

    // Reduce stock
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      })
    ),

    // Create notification
    prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_paid',
        title: 'Payment Successful',
        message: `Your payment of ৳${amount} for order #${order.orderNo} was successful.`,
        data: { orderId: order.id },
      },
    }),
  ]);
}

/**
 * Process failed payment
 */
export async function processFailedPayment(
  tranId: string,
  reason?: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { sslTranId: tranId },
  });

  if (!order) {
    return;
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING },
    }),

    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.PENDING,
        note: `Payment failed: ${reason || 'Unknown error'}`,
      },
    }),

    prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_payment_failed',
        title: 'Payment Failed',
        message: `Payment for order #${order.orderNo} failed. Please try again.`,
        data: { orderId: order.id },
      },
    }),
  ]);
}

/**
 * Initiate refund (requires SSLCommerz approval)
 */
export async function initiateRefund(
  orderId: string,
  refundAmount: number,
  reason: string
): Promise<{ status: string; message: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.sslTranId) {
    throw new Error('Order not found or no transaction ID');
  }

  try {
    const response = await sslcommerz.initiateRefund({
      refund_amount: refundAmount,
      refund_remarks: reason,
      bank_tran_id: order.sslTranId,
      refe_id: `REF_${orderId}_${Date.now()}`,
    });

    if (response.status === 'success') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.REFUNDED },
        }),

        prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.REFUNDED,
            note: `Refund initiated: ৳${refundAmount} - ${reason}`,
          },
        }),
      ]);
    }

    return {
      status: response.status,
      message: response.errorReason || 'Refund initiated',
    };
  } catch (error) {
    throw new Error('Refund initiation failed');
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(tranId: string) {
  try {
    const response = await sslcommerz.transactionQueryByTransactionId({
      tran_id: tranId,
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch transaction status');
  }
}

export { config as sslConfig };
export type { IPNPayload, ValidationResponse, PaymentInitParams };
