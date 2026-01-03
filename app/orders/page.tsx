// app/orders/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

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
  ShoppingBag 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Orders | Paaniyo',
  description: 'View and track your orders from Paaniyo.',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  PROCESSING: { label: 'Processing', icon: Package, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  SHIPPED: { label: 'Shipped', icon: Truck, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  REFUNDED: { label: 'Refunded', icon: AlertCircle, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
};

async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              brand: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: 4,
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/orders');
  }

  const orders = await getOrders(session.user.id);

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
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-12 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="orders-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-primary/20" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#orders-grid)" />
          </svg>
        </div>
        
        <div className="container relative mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            My Orders
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Track and manage your orders
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/50 py-20 text-center backdrop-blur-sm dark:bg-slate-800/50">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              No orders yet
            </h3>
            <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">
              Looks like you haven't placed any orders. Start shopping to see your orders here!
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig?.icon || Clock;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-primary/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig?.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig?.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-primary">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {order._count.items} item{order._count.items > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 4).map((item, i) => (
                        <div
                          key={item.id}
                          className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-700"
                          style={{ zIndex: 4 - i }}
                        >
                          <Image
                            src={item.product.images[0] || '/images/placeholder-product.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                          {item.quantity > 1 && (
                            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                              {item.quantity}
                            </div>
                          )}
                        </div>
                      ))}
                      {order._count.items > 4 && (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300">
                          +{order._count.items - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                        {order.items.map(item => item.product.name).slice(0, 2).join(', ')}
                        {order._count.items > 2 && ` and ${order._count.items - 2} more`}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  {/* Tracking Info */}
                  {order.status === 'SHIPPED' && order.trackingNumber && (
                    <div className="mt-4 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/20">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        <span className="font-medium">Tracking:</span> {order.trackingNumber}
                      </p>
                    </div>
                  )}

                  {/* Expected Delivery */}
                  {order.expectedDelivery && ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status) && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Truck className="h-4 w-4" />
                      Expected delivery: {formatDate(order.expectedDelivery)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
