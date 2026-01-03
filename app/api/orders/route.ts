// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
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

    const { addressId, deliverySlot, paymentMethod, customerNote } = await req.json();

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Verify address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
      include: { zone: true },
    });

    if (!address) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    let depositTotal = 0;
    const orderItems: any[] = [];
    const jarDeposits: any[] = [];

    for (const item of cart.items) {
      const price = Number(item.product.priceBDT);
      const deposit = item.product.depositBDT ? Number(item.product.depositBDT) : 0;
      const itemTotal = price * item.quantity;
      
      subtotal += itemTotal;

      orderItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
        exchangeJars: item.exchangeJars,
      });

      // Track jar deposits
      if (item.product.type === 'JAR' && deposit > 0) {
        const newJars = Math.max(0, item.quantity - item.exchangeJars);
        if (newJars > 0) {
          depositTotal += newJars * deposit;
          jarDeposits.push({
            userId: session.user.id,
            jarType: `${item.product.volumeMl}ml`,
            quantity: newJars,
            depositPaid: newJars * deposit,
          });
        }
      }
    }

    // Delivery fee
    const deliveryFee = subtotal >= 500 ? 0 : (address.zone?.deliveryFee || 30);
    const total = subtotal + depositTotal + deliveryFee;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        addressId,
        deliverySlot: deliverySlot || null,
        subtotal,
        deliveryFee,
        depositTotal,
        total,
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        status: 'PENDING',
        customerNote: customerNote || null,
        items: { create: orderItems },
        jarDeposits: { create: jarDeposits },
      },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // If COD, return order directly
    if (paymentMethod === 'COD') {
      return NextResponse.json({ order });
    }

    // For online payment, would redirect to payment gateway
    // For now, just return order
    return NextResponse.json({ 
      order,
      paymentUrl: `/orders/${order.id}?payment=pending`,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
