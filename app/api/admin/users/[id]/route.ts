import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/admin/users/[id] - Get single user details
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


    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
        isSuspended: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            rating: true,
            title: true,
            isApproved: true,
            createdAt: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
            balance: true,
            commissionRate: true,
            brands: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: { products: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate total spent
    const totalSpent = await prisma.order.aggregate({
      where: {
        userId: id,
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] },
      },
      _sum: { total: true },
    });

    return NextResponse.json({
      user: {
        ...user,
        totalSpent: totalSpent._sum.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user (role, suspend status)
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
    const { action, role } = body;

    // Find the user
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying own account
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      isSuspended?: boolean;
      role?: Role;
    } = {};

    // Handle suspend/unsuspend actions
    if (action === 'suspend') {
      updateData.isSuspended = true;
    } else if (action === 'unsuspend') {
      updateData.isSuspended = false;
    }

    // Handle role change
    if (role) {
      const validRoles: Role[] = ['CUSTOMER', 'VENDOR', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      // Prevent creating too many admins (safety check)
      if (role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' },
        });
        if (adminCount >= 10) {
          return NextResponse.json(
            { error: 'Maximum admin limit reached' },
            { status: 400 }
          );
        }
      }

      updateData.role = role;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
      },
    });

    // Log the action
    console.log(`Admin ${session.user.email} updated user ${id}:`, {
      action,
      role,
      previousRole: existingUser.role,
      previousSuspended: existingUser.isSuspended,
    });

    return NextResponse.json({
      user: updatedUser,
      message: action
        ? `User ${action}ed successfully`
        : 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete via suspend)
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


    // Find the user
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting own account
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting users with order history (soft delete instead)
    if (user._count.orders > 0) {
      await prisma.user.update({
        where: { id },
        data: { isSuspended: true },
      });
      return NextResponse.json({
        message: 'User has order history - suspended instead of deleted',
      });
    }

    // For users with no orders, perform actual deletion
    // Note: This cascades to related records per Prisma schema
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
