import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import DOMPurify from 'isomorphic-dompurify';

// GET /api/admin/products/[id] - Get product details
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


    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get order stats
    const orderStats = await prisma.orderItem.aggregate({
      where: { productId: id },
      _sum: {
        quantity: true,
        total: true,
      },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId: id, status: 'APPROVED' },
      _count: { rating: true },
    });

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      },
      stats: {
        totalOrders: product._count.orderItems,
        totalSold: orderStats._sum.quantity || 0,
        totalRevenue: Number(orderStats._sum.total || 0),
        reviewCount: product._count.reviews,
        wishlistCount: product._count.wishlistItems,
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count.rating;
          return acc;
        }, {} as Record<number, number>),
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id] - Update product
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

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Basic fields
    if (body.name !== undefined) {
      updateData.name = DOMPurify.sanitize(body.name.trim());
      updateData.slug = body.name.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    if (body.description !== undefined) {
      updateData.description = DOMPurify.sanitize(body.description.trim());
    }
    if (body.shortDescription !== undefined) {
      updateData.shortDescription = DOMPurify.sanitize(body.shortDescription.trim());
    }
    if (body.sku !== undefined) {
      updateData.sku = body.sku.trim().toUpperCase();
    }

    // Pricing
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'Invalid price' },
          { status: 400 }
        );
      }
      updateData.price = price;
    }
    if (body.comparePrice !== undefined) {
      if (body.comparePrice === null || body.comparePrice === '') {
        updateData.comparePrice = null;
      } else {
        const comparePrice = parseFloat(body.comparePrice);
        if (isNaN(comparePrice) || comparePrice < 0) {
          return NextResponse.json(
            { error: 'Invalid compare price' },
            { status: 400 }
          );
        }
        updateData.comparePrice = comparePrice;
      }
    }

    // Stock
    if (body.stock !== undefined) {
      const stock = parseInt(body.stock);
      if (isNaN(stock) || stock < 0) {
        return NextResponse.json(
          { error: 'Invalid stock' },
          { status: 400 }
        );
      }
      updateData.stock = stock;
    }

    // Status
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }

    // Relations
    if (body.categoryId !== undefined) {
      if (body.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: body.categoryId },
        });
        if (!category) {
          return NextResponse.json(
            { error: 'Invalid category' },
            { status: 400 }
          );
        }
      }
      updateData.categoryId = body.categoryId || null;
    }
    if (body.brandId !== undefined) {
      if (body.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: body.brandId },
        });
        if (!brand) {
          return NextResponse.json(
            { error: 'Invalid brand' },
            { status: 400 }
          );
        }
      }
      updateData.brandId = body.brandId || null;
    }

    // Images
    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) {
        return NextResponse.json(
          { error: 'Images must be an array' },
          { status: 400 }
        );
      }
      updateData.images = body.images;
    }

    // Product attributes
    if (body.size !== undefined) {
      updateData.size = body.size;
    }
    if (body.packSize !== undefined) {
      updateData.packSize = parseInt(body.packSize) || 1;
    }
    if (body.waterType !== undefined) {
      updateData.waterType = body.waterType;
    }
    if (body.ph !== undefined) {
      updateData.ph = body.ph ? parseFloat(body.ph) : null;
    }
    if (body.tds !== undefined) {
      updateData.tds = body.tds ? parseInt(body.tds) : null;
    }
    if (body.minerals !== undefined) {
      updateData.minerals = body.minerals;
    }
    if (body.source !== undefined) {
      updateData.source = DOMPurify.sanitize(body.source?.trim() || '');
    }

    // SEO fields
    if (body.metaTitle !== undefined) {
      updateData.metaTitle = DOMPurify.sanitize(body.metaTitle?.trim() || '');
    }
    if (body.metaDescription !== undefined) {
      updateData.metaDescription = DOMPurify.sanitize(body.metaDescription?.trim() || '');
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      product: {
        ...updatedProduct,
        price: Number(updatedProduct.price),
        comparePrice: updatedProduct.comparePrice ? Number(updatedProduct.comparePrice) : null,
      },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
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


    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If product has orders, deactivate instead of delete
    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Product has orders and was deactivated instead of deleted',
        deactivated: true,
      });
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      message: 'Product deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
