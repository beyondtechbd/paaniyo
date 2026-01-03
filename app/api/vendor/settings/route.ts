// app/api/vendor/settings/route.ts
// Vendor Settings Management API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Update settings schema
const updateSettingsSchema = z.object({
  // Business Info
  businessName: z.string().min(2).max(100).optional(),
  tradeLicense: z.string().max(50).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  
  // Contact
  contactName: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(10).max(15).optional(),
  
  // Banking
  bankName: z.string().max(100).optional().nullable(),
  bankAccount: z.string().max(50).optional().nullable(),
  bankRouting: z.string().max(20).optional().nullable(),
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/).optional().nullable(),
})

// GET: Fetch vendor settings
export async function GET() {
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
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true,
          },
        },
        brands: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
    
    return NextResponse.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        tradeLicense: vendor.tradeLicense,
        taxId: vendor.taxId,
        status: vendor.status,
        
        // Contact
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        
        // Commission
        commissionRate: parseFloat(vendor.commissionRate.toString()),
        balance: parseFloat(vendor.balance.toString()),
        
        // Banking
        bankName: vendor.bankName,
        bankAccount: vendor.bankAccount,
        bankRouting: vendor.bankRouting,
        bkashNumber: vendor.bkashNumber,
        
        // Meta
        brands: vendor.brands,
        createdAt: vendor.createdAt,
        approvedAt: vendor.approvedAt,
        
        // User info
        userEmail: vendor.user.email,
        userName: vendor.user.name,
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH: Update vendor settings
export async function PATCH(request: NextRequest) {
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
    const validatedData = updateSettingsSchema.parse(body)
    
    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    // Business info
    if (validatedData.businessName !== undefined) {
      updateData.businessName = DOMPurify.sanitize(validatedData.businessName.trim())
    }
    
    if (validatedData.tradeLicense !== undefined) {
      updateData.tradeLicense = validatedData.tradeLicense
        ? DOMPurify.sanitize(validatedData.tradeLicense.trim())
        : null
    }
    
    if (validatedData.taxId !== undefined) {
      updateData.taxId = validatedData.taxId
        ? DOMPurify.sanitize(validatedData.taxId.trim())
        : null
    }
    
    // Contact info
    if (validatedData.contactName !== undefined) {
      updateData.contactName = DOMPurify.sanitize(validatedData.contactName.trim())
    }
    
    if (validatedData.contactEmail !== undefined) {
      updateData.contactEmail = validatedData.contactEmail.toLowerCase().trim()
    }
    
    if (validatedData.contactPhone !== undefined) {
      updateData.contactPhone = validatedData.contactPhone.trim()
    }
    
    // Banking info
    if (validatedData.bankName !== undefined) {
      updateData.bankName = validatedData.bankName
        ? DOMPurify.sanitize(validatedData.bankName.trim())
        : null
    }
    
    if (validatedData.bankAccount !== undefined) {
      updateData.bankAccount = validatedData.bankAccount
        ? validatedData.bankAccount.trim()
        : null
    }
    
    if (validatedData.bankRouting !== undefined) {
      updateData.bankRouting = validatedData.bankRouting
        ? validatedData.bankRouting.trim()
        : null
    }
    
    if (validatedData.bkashNumber !== undefined) {
      updateData.bkashNumber = validatedData.bkashNumber
        ? validatedData.bkashNumber.trim()
        : null
    }
    
    // Update vendor
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    })
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      vendor: {
        id: updatedVendor.id,
        businessName: updatedVendor.businessName,
        tradeLicense: updatedVendor.tradeLicense,
        taxId: updatedVendor.taxId,
        contactName: updatedVendor.contactName,
        contactEmail: updatedVendor.contactEmail,
        contactPhone: updatedVendor.contactPhone,
        bankName: updatedVendor.bankName,
        bankAccount: updatedVendor.bankAccount,
        bankRouting: updatedVendor.bankRouting,
        bkashNumber: updatedVendor.bkashNumber,
        updatedAt: updatedVendor.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
