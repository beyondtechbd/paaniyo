// app/orders/[id]/page.tsx
export const dynamic = 'force-dynamic';
import { redirect, notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  Receipt,
  Phone,
  Mail,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Details | Paaniyo',
  description: 'View your order details and tracking information.',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Payment Pending', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  CONFIRMED: { label: 'Order Confirmed', icon: CheckCircle2, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  PROCESSING: { label: 'Processing', icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  SHIPPED: { label: 'Shipped', icon: Truck, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  REFUNDED: { label: 'Refunded', icon: AlertCircle, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800' },
};

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

async function getOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              volumeMl: true,
              brand: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
      address: true,
    },
  });
}

export default async function OrderDetailPage({ params, searchParams }: OrderPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/orders');
  }

  const { id } = await params;
  const { status: statusQuery } = await searchParams;
  const order = await getOrder(id, session.user.id);

  if (!order) {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || Clock;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-8 md:py-12">
        <div className="absolute inset-0 opacity-30">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="order-detail-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-primary/20" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#order-detail-grid)" />
          </svg>
        </div>
        
        <div className="container relative mx-auto px-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                Order #{order.orderNumber}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig?.label}
            </span>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Success Message for New Orders */}
        {statusQuery === 'pending' && (
          <div className="mb-8 rounded-2xl bg-green-50 p-6 dark:bg-green-900/20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-green-800 dark:text-green-200">
                  Order Placed Successfully!
                </h3>
                <p className="mt-1 text-green-700 dark:text-green-300">
                  Thank you for your order. We'll send you updates on your order status via email.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Progress */}
            {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Order Progress
                </h2>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const stepConfig = STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
                      const StepIcon = stepConfig.icon;
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                            isCompleted || isCurrent
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <StepIcon className="h-5 w-5" />
                            )}
                          </div>
                          <span className={`mt-2 text-xs font-medium ${
                            isCompleted || isCurrent
                              ? 'text-primary'
                              : 'text-slate-400'
                          }`}>
                            {stepConfig.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center">
                    {STATUS_STEPS.slice(0, -1).map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 ${
                          index < currentStepIndex
                            ? 'bg-primary'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tracking Number</p>
                        <p className="font-mono font-medium text-slate-900 dark:text-white">
                          {order.trackingNumber}
                        </p>
                      </div>
                      <button className="rounded-lg bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-600 dark:text-slate-300">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Track Package
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Expected Delivery */}
                {order.expectedDelivery && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Truck className="h-4 w-4" />
                    Expected delivery: {formatShortDate(order.expectedDelivery)}
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Order Items ({order.items.length})
              </h2>
              <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-700/50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700"
                    >
                      <Image
                        src={item.product.images[0] || '/images/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="font-medium text-slate-900 hover:text-primary dark:text-white"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {item.product.brand.name}
                        {item.product.volumeMl && ` • ${item.product.volumeMl}ml`}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm text-slate-400">×</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Note */}
            {order.note && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Order Note
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400">
                  {order.note}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Order Summary
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                  <span className={`font-medium ${order.shipping === 0 ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                    {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Discount</span>
                    <span className="font-medium text-green-600">
                      -{formatPrice(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">VAT (15%)</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatPrice(order.vat)}
                  </span>
                </div>
                <div className="my-3 h-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex justify-between">
                  <span className="font-display font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Method</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'SSLCommerz'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Status</span>
                  <span className={`font-medium ${
                    order.paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : order.paymentStatus === 'PENDING'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Transaction</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white">
                      {order.transactionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Address
                </h2>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium text-slate-900 dark:text-white">{order.address.name}</p>
                  <p className="mt-1">{order.address.address}</p>
                  <p>{order.address.city}, {order.address.district}</p>
                  {order.address.postalCode && <p>Postal Code: {order.address.postalCode}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {order.address.phone}
                  </div>
                </div>
              </div>
            )}

            {/* Need Help */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Need Help?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Have questions about your order? Our support team is here to help.
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href="mailto:support@paaniyo.com"
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  <Mail className="h-4 w-4" />
                  support@paaniyo.com
                </a>
                <a
                  href="tel:+8801700000000"
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  <Phone className="h-4 w-4" />
                  +880 1700-000-000
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
