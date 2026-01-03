// app/api/tracker/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RateLimitTier } from '@/lib/rate-limit';
import { z } from 'zod';

const settingsSchema = z.object({
  dailyGoal: z.number().min(500).max(10000).optional(), // 500ml to 10L
  glassSize: z.number().min(50).max(1000).optional(), // 50ml to 1L
  reminderEnabled: z.boolean().optional(),
  reminderTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).optional(),
});

// GET - Fetch user's tracker settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.trackerSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.trackerSettings.create({
        data: {
          userId: session.user.id,
          dailyGoalMl: 3000,
          reminderEnabled: true,
          reminderTimes: ['08:00', '12:00', '16:00', '20:00'],
          glassSize: 250,
        },
      });
    }

    return NextResponse.json({
      dailyGoal: settings.dailyGoalMl,
      glassSize: settings.glassSize,
      reminderEnabled: settings.reminderEnabled,
      reminderTimes: settings.reminderTimes,
    });
  } catch (error) {
    console.error('Error fetching tracker settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH - Update tracker settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitTier.API);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { dailyGoal, glassSize, reminderEnabled, reminderTimes } = validation.data;
    const userId = session.user.id;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (dailyGoal !== undefined) updateData.dailyGoalMl = dailyGoal;
    if (glassSize !== undefined) updateData.glassSize = glassSize;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderTimes !== undefined) updateData.reminderTimes = reminderTimes;

    // Upsert settings
    const settings = await prisma.trackerSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        dailyGoalMl: dailyGoal || 3000,
        glassSize: glassSize || 250,
        reminderEnabled: reminderEnabled ?? true,
        reminderTimes: reminderTimes || ['08:00', '12:00', '16:00', '20:00'],
      },
    });

    // Also update today's goal if dailyGoal changed
    if (dailyGoal !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.trackerLog.updateMany({
        where: {
          userId,
          date: today,
        },
        data: {
          goalMl: dailyGoal,
          goalMet: { set: false }, // Will be recalculated
        },
      });

      // Recalculate goalMet for today
      const todayLog = await prisma.trackerLog.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (todayLog) {
        await prisma.trackerLog.update({
          where: { id: todayLog.id },
          data: {
            goalMet: todayLog.intakeMl >= dailyGoal,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Settings updated',
      settings: {
        dailyGoal: settings.dailyGoalMl,
        glassSize: settings.glassSize,
        reminderEnabled: settings.reminderEnabled,
        reminderTimes: settings.reminderTimes,
      },
    });
  } catch (error) {
    console.error('Error updating tracker settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
