// app/api/subscriptions/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { include: { brand: true } } },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, frequency, addressId, preferredSlot } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    if (!addressId) {
      return NextResponse.json({ error: 'Delivery address required' }, { status: 400 });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Calculate next delivery based on frequency
    const now = new Date();
    let nextDelivery = new Date(now);
    
    switch (frequency) {
      case 'DAILY':
        nextDelivery.setDate(nextDelivery.getDate() + 1);
        break;
      case 'ALTERNATE':
        nextDelivery.setDate(nextDelivery.getDate() + 2);
        break;
      case 'TWICE_WEEKLY':
        nextDelivery.setDate(nextDelivery.getDate() + 3);
        break;
      case 'WEEKLY':
        nextDelivery.setDate(nextDelivery.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDelivery.setDate(nextDelivery.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDelivery.setMonth(nextDelivery.getMonth() + 1);
        break;
      default:
        nextDelivery.setDate(nextDelivery.getDate() + 7);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        addressId,
        frequency: frequency || 'WEEKLY',
        preferredSlot: preferredSlot || '9am-12pm',
        startDate: now,
        nextDelivery,
        status: 'ACTIVE',
        paymentMethod: 'COD',
        items: {
          create: items.map((item: { productId: string; quantity: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
