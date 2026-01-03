import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getPasswordResetTemplate } from '@/lib/email';
import crypto from 'crypto';

// POST /api/auth/forgot-password - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, passwordHash: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent',
      });
    }

    // Check if user has a password (not OAuth-only)
    if (!user.passwordHash) {
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent',
      });
    }

    // Check for existing token (rate limiting)
    const existingToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingToken) {
      // Check if it was created less than 60 seconds ago
      const tokenAge = Date.now() - existingToken.createdAt.getTime();
      if (tokenAge < 60 * 1000) {
        return NextResponse.json(
          { error: 'Please wait before requesting another email' },
          { status: 429 }
        );
      }
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send email
    const { subject, html, text } = getPasswordResetTemplate(user.name || '', resetUrl);
    const result = await sendEmail({ to: email.toLowerCase(), subject, html, text });

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error);
      // Still return success to not reveal if email was sent
    }

    return NextResponse.json({
      message: 'If an account exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
