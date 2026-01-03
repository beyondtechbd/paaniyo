// app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [], subtotal: 0, deposit: 0, total: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { brand: { select: { name: true, slug: true } } },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], subtotal: 0, deposit: 0, total: 0 });
    }

    // Calculate totals
    let subtotal = 0;
    let depositTotal = 0;

    const items = cart.items.map((item) => {
      const price = Number(item.product.priceBDT);
      const deposit = item.product.depositBDT ? Number(item.product.depositBDT) : 0;
      const itemTotal = price * item.quantity;
      
      // Deposit only for new jars (not exchanged)
      const newJars = Math.max(0, item.quantity - item.exchangeJars);
      const itemDeposit = newJars * deposit;

      subtotal += itemTotal;
      depositTotal += itemDeposit;

      return {
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        brand: item.product.brand?.name,
        image: item.product.images?.[0] || null,
        price,
        deposit,
        quantity: item.quantity,
        exchangeJars: item.exchangeJars,
        type: item.product.type,
        volumeMl: item.product.volumeMl,
        itemTotal,
        itemDeposit,
      };
    });

    return NextResponse.json({
      items,
      subtotal,
      deposit: depositTotal,
      total: subtotal + depositTotal,
    });
  } catch (error: any) {
    console.error('Cart fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, quantity, exchangeJars } = await req.json();

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { 
          quantity,
          exchangeJars: exchangeJars !== undefined ? exchangeJars : item.exchangeJars,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      // Delete single item
      const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!item || item.cart.userId !== session.user.id) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      // Clear cart
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
