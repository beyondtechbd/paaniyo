import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, getEmailVerificationTemplate } from '@/lib/email';
import crypto from 'crypto';

// POST /api/auth/verify-email - Send verification email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is logged in or email is provided
    let email: string;
    let name: string | null = null;

    if (session?.user) {
      // Resend verification for logged-in user
      if (session.user.emailVerified) {
        return NextResponse.json(
          { error: 'Email is already verified' },
          { status: 400 }
        );
      }
      email = session.user.email!;
      name = session.user.name;
    } else {
      // Send verification for provided email
      const body = await request.json();
      email = body.email;
      
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, emailVerified: true },
      });

      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({
          message: 'If an account exists, a verification email has been sent',
        });
      }

      if (user.emailVerified) {
        return NextResponse.json({
          message: 'If an account exists, a verification email has been sent',
        });
      }

      name = user.name;
    }

    // Check for existing token (rate limiting)
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gt: new Date() },
      },
    });

    if (existingToken) {
      // Check if it was created less than 60 seconds ago
      const tokenAge = Date.now() - new Date(existingToken.expires).getTime() + 24 * 60 * 60 * 1000;
      if (tokenAge < 60 * 1000) {
        return NextResponse.json(
          { error: 'Please wait before requesting another email' },
          { status: 429 }
        );
      }
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    const { subject, html, text } = getEmailVerificationTemplate(name || '', verifyUrl);
    const result = await sendEmail({ to: email, subject, html, text });

    if (!result.success) {
      console.error('Failed to send verification email:', result.error);
      // Still return success to not reveal if email was sent
    }

    return NextResponse.json({
      message: 'If an account exists, a verification email has been sent',
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

// GET /api/auth/verify-email - Verify email token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Invalid verification link' },
        { status: 400 }
      );
    }

    // Find token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      });
      return NextResponse.json(
        { error: 'Verification link has expired' },
        { status: 400 }
      );
    }

    // Update user
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
