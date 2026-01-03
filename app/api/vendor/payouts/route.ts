// app/api/vendor/payouts/route.ts
// Vendor Payout Management API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const MINIMUM_PAYOUT = 1000 // ৳1,000 minimum

// Request payout schema
const requestPayoutSchema = z.object({
  method: z.enum(['BANK_TRANSFER', 'BKASH', 'NAGAD']),
  amount: z.number().min(MINIMUM_PAYOUT),
})

// GET: Fetch payout history
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      )
    }
    
    if (vendor.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Vendor account not approved' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    
    // Build query
    const where: Record<string, unknown> = { vendorId: vendor.id }
    
    if (status) {
      where.status = status
    }
    
    // Fetch payouts
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ])
    
    // Get stats
    const stats = await prisma.payout.groupBy({
      by: ['status'],
      where: { vendorId: vendor.id },
      _sum: { amount: true },
      _count: true,
    })
    
    const statsMap = {
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    }
    
    stats.forEach(stat => {
      const key = stat.status.toLowerCase() as keyof typeof statsMap
      if (statsMap[key]) {
        statsMap[key] = {
          count: stat._count,
          amount: stat._sum.amount ? parseFloat(stat._sum.amount.toString()) : 0,
        }
      }
    })
    
    return NextResponse.json({
      payouts: payouts.map(payout => ({
        id: payout.id,
        amount: parseFloat(payout.amount.toString()),
        method: payout.method,
        status: payout.status,
        bankName: payout.bankName,
        bankAccount: payout.bankAccount,
        mfsNumber: payout.mfsNumber,
        reference: payout.reference,
        notes: payout.notes,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt,
        completedAt: payout.completedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsMap,
      balance: parseFloat(vendor.balance.toString()),
      minimumPayout: MINIMUM_PAYOUT,
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

// POST: Request a payout
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      )
    }
    
    if (vendor.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Vendor account not approved' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = requestPayoutSchema.parse(body)
    
    // Check balance
    const balance = parseFloat(vendor.balance.toString())
    
    if (balance < MINIMUM_PAYOUT) {
      return NextResponse.json(
        { error: `Minimum balance of ৳${MINIMUM_PAYOUT.toLocaleString()} required for payout` },
        { status: 400 }
      )
    }
    
    if (validatedData.amount > balance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Check if there's already a pending payout
    const pendingPayout = await prisma.payout.findFirst({
      where: {
        vendorId: vendor.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    })
    
    if (pendingPayout) {
      return NextResponse.json(
        { error: 'You already have a pending payout request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }
    
    // Validate payment method details
    if (validatedData.method === 'BANK_TRANSFER') {
      if (!vendor.bankName || !vendor.bankAccount) {
        return NextResponse.json(
          { error: 'Please add your bank details in settings before requesting a bank transfer payout' },
          { status: 400 }
        )
      }
    } else if (validatedData.method === 'BKASH') {
      if (!vendor.bkashNumber) {
        return NextResponse.json(
          { error: 'Please add your bKash number in settings before requesting a bKash payout' },
          { status: 400 }
        )
      }
    }
    
    // Create payout request
    const payout = await prisma.$transaction(async (tx) => {
      // Create payout
      const newPayout = await tx.payout.create({
        data: {
          vendorId: vendor.id,
          amount: validatedData.amount,
          method: validatedData.method,
          status: 'PENDING',
          bankName: validatedData.method === 'BANK_TRANSFER' ? vendor.bankName : null,
          bankAccount: validatedData.method === 'BANK_TRANSFER' ? vendor.bankAccount : null,
          bankRouting: validatedData.method === 'BANK_TRANSFER' ? vendor.bankRouting : null,
          mfsNumber: validatedData.method !== 'BANK_TRANSFER' ? vendor.bkashNumber : null,
        },
      })
      
      // Deduct from balance
      await tx.vendor.update({
        where: { id: vendor.id },
        data: {
          balance: {
            decrement: validatedData.amount,
          },
        },
      })
      
      return newPayout
    })
    
    return NextResponse.json({
      message: 'Payout request submitted successfully',
      payout: {
        id: payout.id,
        amount: parseFloat(payout.amount.toString()),
        method: payout.method,
        status: payout.status,
        createdAt: payout.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}
