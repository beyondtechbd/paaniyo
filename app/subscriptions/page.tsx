// app/subscriptions/page.tsx
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionsClient } from '@/components/subscriptions/SubscriptionsClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Subscriptions | Paaniyo',
  description: 'Set up automatic water delivery subscriptions',
};

async function getData(userId: string) {
  const [subscriptions, subscribableProducts, addresses] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      include: {
        items: { include: { product: { include: { brand: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { isActive: true, isSubscribable: true },
      include: { brand: { select: { name: true } } },
      orderBy: { isFeatured: 'desc' },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    }),
  ]);

  return { subscriptions, subscribableProducts, addresses };
}

export default async function SubscriptionsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/subscriptions');
  }

  const data = await getData(session.user.id);

  return <SubscriptionsClient data={data} />;
}
