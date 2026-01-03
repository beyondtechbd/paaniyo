// app/wishlist/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WishlistClient } from '@/components/wishlist/WishlistClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Paaniyo',
  description: 'View and manage your saved products.',
};

async function getWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          stock: true,
          status: true,
          isAvailable: true,
          freeShipping: true,
          volumeMl: true,
          avgRating: true,
          reviewCount: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return wishlist.map(item => ({
    id: item.id,
    productId: item.productId,
    addedAt: item.createdAt,
    product: {
      ...item.product,
      image: item.product.images[0] || '/images/placeholder-product.jpg',
      available: item.product.status === 'ACTIVE' && item.product.isAvailable && item.product.stock > 0,
      discount: item.product.comparePrice
        ? Math.round(((item.product.comparePrice - item.product.price) / item.product.comparePrice) * 100)
        : 0,
    },
  }));
}

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/wishlist');
  }

  const items = await getWishlist(session.user.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-12 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="wishlist-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-primary/20" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#wishlist-grid)" />
          </svg>
        </div>
        
        <div className="container relative mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {items.length > 0 
              ? `You have ${items.length} item${items.length > 1 ? 's' : ''} saved`
              : 'Save products you love for later'
            }
          </p>
        </div>
      </section>

      <WishlistClient initialItems={items} />
    </main>
  );
}
