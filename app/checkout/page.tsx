// app/checkout/page.tsx
export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CheckoutClient } from '@/components/checkout/CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout | Paaniyo',
  description: 'Complete your order',
};

async function getData(userId: string) {
  const [cart, addresses, zones] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { brand: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.address.findMany({
      where: { userId },
      include: { zone: true },
      orderBy: { isDefault: 'desc' },
    }),
    prisma.zone.findMany({
      where: { isActive: true },
      include: { slots: { where: { isActive: true } } },
    }),
  ]);

  return { cart, addresses, zones };
}

export default async function CheckoutPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/checkout');
  }

  const data = await getData(session.user.id);

  if (!data.cart || data.cart.items.length === 0) {
    redirect('/cart');
  }

  return <CheckoutClient data={data} />;
}
