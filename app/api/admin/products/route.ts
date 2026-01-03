import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, inactive, outofstock
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isActive = true;
      where.stock = { gt: 0 };
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'outofstock') {
      where.stock = { lte: 0 };
    }

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy
    const orderBy: Record<string, string> = {};
    if (['createdAt', 'name', 'price', 'stock', 'rating', 'reviewCount'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch products with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              vendor: {
                select: {
                  id: true,
                  businessName: true,
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
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Get counts by status
    const [activeCount, inactiveCount, outOfStockCount] = await Promise.all([
      prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
    ]);

    // Get categories and brands for filters
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
        ordersCount: p._count.orderItems,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      counts: {
        active: activeCount,
        inactive: inactiveCount,
        outOfStock: outOfStockCount,
        total: total,
      },
      filters: {
        categories,
        brands,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
