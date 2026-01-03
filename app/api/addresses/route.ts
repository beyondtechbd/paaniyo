// app/api/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RateLimitTier } from '@/lib/rate-limit';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const addressSchema = z.object({
  name: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())),
  phone: z.string().min(10).max(20).transform(val => DOMPurify.sanitize(val.trim())),
  address: z.string().min(10).max(500).transform(val => DOMPurify.sanitize(val.trim())),
  city: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())),
  district: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())),
  postalCode: z.string().max(20).optional().transform(val => val ? DOMPurify.sanitize(val.trim()) : null),
  type: z.enum(['HOME', 'OFFICE']).default('HOME'),
  isDefault: z.boolean().default(false),
});

// GET - Fetch all addresses for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitTier.API);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const validation = addressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address (make it default automatically)
    const existingAddresses = await prisma.address.count({
      where: { userId: session.user.id },
    });

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: session.user.id,
        isDefault: data.isDefault || existingAddresses === 0,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
