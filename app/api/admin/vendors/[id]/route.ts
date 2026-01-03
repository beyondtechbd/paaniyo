import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { VendorStatus } from '@prisma/client';

// GET /api/admin/vendors/[id] - Get single vendor details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            image: true,
            createdAt: true,
          },
        },
        brands: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/vendors/[id] - Update vendor status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, commissionRate, notes } = body;

    // Validate status
    const validStatuses: VendorStatus[] = ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find the vendor
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      status?: VendorStatus;
      approvedAt?: Date | null;
      commissionRate?: number;
    } = {};

    if (status) {
      updateData.status = status;
      
      // Set approvedAt when approving
      if (status === 'APPROVED' && existingVendor.status !== 'APPROVED') {
        updateData.approvedAt = new Date();
      }
      
      // Clear approvedAt when rejecting or suspending (optional, keep history)
      // if (status === 'REJECTED' || status === 'SUSPENDED') {
      //   updateData.approvedAt = null;
      // }
    }

    // Update commission rate if provided
    if (commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.commissionRate = rate;
    }

    // Update the vendor
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        brands: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the action (you could create an AdminAction model for this)
    console.log(`Admin ${session.user.email} updated vendor ${id}:`, {
      previousStatus: existingVendor.status,
      newStatus: status,
      commissionRate,
      notes,
    });

    // TODO: Send email notification to vendor about status change
    // await sendVendorStatusEmail(existingVendor.user.email, status, notes);

    return NextResponse.json({
      vendor: updatedVendor,
      message: `Vendor ${status ? status.toLowerCase() : 'updated'} successfully`,
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[id] - Delete vendor (soft delete by setting status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion if vendor has order history
    if (vendor._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with order history. Consider suspending instead.' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to REJECTED
    // For hard delete, you would need to delete related records first
    await prisma.vendor.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
