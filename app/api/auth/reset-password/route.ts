import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/auth/reset-password - Validate reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Invalid reset link' },
        { status: 400 }
      );
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        token,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check expiry
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        { error: 'Reset link has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { error: 'Failed to validate reset link' },
      { status: 500 }
    );
  }
}

// POST /api/auth/reset-password - Reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        token,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check expiry
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        { error: 'Reset link has expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        passwordHash,
        failedAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock account
      },
    });

    // Delete all reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Invalidate all sessions (optional - for security)
    await prisma.session.deleteMany({
      where: {
        user: { email: email.toLowerCase() },
      },
    });

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
