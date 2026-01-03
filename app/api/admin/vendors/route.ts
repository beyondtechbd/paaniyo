// app/api/admin/vendors/route.ts
// Admin Vendor Management API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List vendors with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Fetch vendors
    const [vendors, total, pending, approved, suspended] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          brands: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { products: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
      prisma.vendor.count({ where: { status: 'APPROVED' } }),
      prisma.vendor.count({ where: { status: 'SUSPENDED' } }),
    ])
    
    return NextResponse.json({
      vendors: vendors.map(vendor => ({
        id: vendor.id,
        businessName: vendor.businessName,
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        tradeLicense: vendor.tradeLicense,
        taxId: vendor.taxId,
        status: vendor.status,
        bankName: vendor.bankName,
        bankAccount: vendor.bankAccount,
        bkashNumber: vendor.bkashNumber,
        commissionRate: parseFloat(vendor.commissionRate.toString()),
        balance: parseFloat(vendor.balance.toString()),
        createdAt: vendor.createdAt.toISOString(),
        approvedAt: vendor.approvedAt?.toISOString() || null,
        user: vendor.user,
        brands: vendor.brands.map(brand => ({
          id: brand.id,
          name: brand.name,
          productCount: brand._count.products,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        pending,
        approved,
        suspended,
        total: pending + approved + suspended,
      },
    })
  } catch (error) {
    console.error('Admin vendors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
