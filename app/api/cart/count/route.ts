// app/api/cart/count/route.ts
// Get cart item count for navbar badge

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ count: 0 });
    }

    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Cart count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
