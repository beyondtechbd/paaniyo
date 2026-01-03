// app/api/addresses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RateLimitTier } from '@/lib/rate-limit';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const updateAddressSchema = z.object({
  name: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())).optional(),
  phone: z.string().min(10).max(20).transform(val => DOMPurify.sanitize(val.trim())).optional(),
  address: z.string().min(10).max(500).transform(val => DOMPurify.sanitize(val.trim())).optional(),
  city: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())).optional(),
  district: z.string().min(2).max(100).transform(val => DOMPurify.sanitize(val.trim())).optional(),
  postalCode: z.string().max(20).optional().transform(val => val ? DOMPurify.sanitize(val.trim()) : null),
  type: z.enum(['HOME', 'OFFICE']).optional(),
  isDefault: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch single address
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}

// PATCH - Update address
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitTier.API);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }


    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE - Delete address
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitTier.API);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }


    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Don't allow deleting the only default address without setting another
    if (existingAddress.isDefault) {
      const otherAddresses = await prisma.address.findFirst({
        where: { userId: session.user.id, id: { not: id } },
      });

      if (otherAddresses) {
        // Set another address as default
        await prisma.address.update({
          where: { id: otherAddresses.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
