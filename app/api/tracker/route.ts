// app/api/tracker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RateLimitTier } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema for logging water intake
const logIntakeSchema = z.object({
  amount: z.number().min(1).max(5000), // ml
  type: z.enum(['water', 'tea', 'juice', 'other']).optional().default('water'),
  time: z.string().optional(), // HH:MM format
});

// GET - Fetch today's tracker data and weekly stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'today'; // today, week, month
    const dateParam = searchParams.get('date'); // For specific date

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's tracker settings
    let settings = await prisma.trackerSettings.findUnique({
      where: { userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.trackerSettings.create({
        data: {
          userId,
          dailyGoalMl: 3000,
          reminderEnabled: true,
          reminderTimes: ['08:00', '12:00', '16:00', '20:00'],
          glassSize: 250,
        },
      });
    }

    // Calculate date range based on view
    let startDate: Date;
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // Include today

    if (view === 'week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
    } else if (view === 'month') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
    } else {
      startDate = today;
    }

    // Fetch logs for the date range
    const logs = await prisma.trackerLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get today's log specifically
    const todayLog = logs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    // Calculate streak
    let streak = 0;
    const dailyGoal = settings.dailyGoalMl;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const log = logs.find(l => {
        const logDate = new Date(l.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === checkDate.getTime();
      });
      
      if (log && log.intakeMl >= dailyGoal * 0.8) { // 80% counts as goal met
        streak++;
      } else if (i > 0) { // Don't break streak for today
        break;
      }
    }

    // Format response based on view
    const dailyData = logs.map(log => ({
      date: log.date,
      intake: log.intakeMl,
      goal: log.goalMl,
      goalMet: log.goalMet,
      percentage: Math.round((log.intakeMl / log.goalMl) * 100),
      entries: log.entries as Array<{ time: string; ml: number; type: string }> || [],
    }));

    // Calculate weekly average
    const weeklyTotal = logs
      .filter(log => {
        const logDate = new Date(log.date);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= weekAgo;
      })
      .reduce((sum, log) => sum + log.intakeMl, 0);
    
    const weeklyAverage = Math.round(weeklyTotal / 7);

    return NextResponse.json({
      today: {
        intake: todayLog?.intakeMl || 0,
        goal: settings.dailyGoalMl,
        percentage: Math.round(((todayLog?.intakeMl || 0) / settings.dailyGoalMl) * 100),
        entries: (todayLog?.entries as Array<{ time: string; ml: number; type: string }>) || [],
        goalMet: todayLog?.goalMet || false,
      },
      streak,
      weeklyAverage,
      settings: {
        dailyGoal: settings.dailyGoalMl,
        glassSize: settings.glassSize,
        reminderEnabled: settings.reminderEnabled,
        reminderTimes: settings.reminderTimes,
      },
      history: dailyData,
    });
  } catch (error) {
    console.error('Error fetching tracker data:', error);
    return NextResponse.json({ error: 'Failed to fetch tracker data' }, { status: 500 });
  }
}

// POST - Log water intake
export async function POST(request: NextRequest) {
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
    const validation = logIntakeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { amount, type, time } = validation.data;
    const userId = session.user.id;
    
    // Get today's date (UTC midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's settings for goal
    const settings = await prisma.trackerSettings.findUnique({
      where: { userId },
    });
    const dailyGoal = settings?.dailyGoalMl || 3000;

    // Create entry object
    const entry = {
      time: time || new Date().toTimeString().slice(0, 5),
      ml: amount,
      type,
    };

    // Upsert today's log
    const existingLog = await prisma.trackerLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    let updatedLog;

    if (existingLog) {
      // Update existing log
      const currentEntries = (existingLog.entries as Array<{ time: string; ml: number; type: string }>) || [];
      const newIntake = existingLog.intakeMl + amount;
      
      updatedLog = await prisma.trackerLog.update({
        where: { id: existingLog.id },
        data: {
          intakeMl: newIntake,
          goalMet: newIntake >= dailyGoal,
          entries: [...currentEntries, entry],
        },
      });
    } else {
      // Create new log for today
      updatedLog = await prisma.trackerLog.create({
        data: {
          userId,
          date: today,
          intakeMl: amount,
          goalMl: dailyGoal,
          goalMet: amount >= dailyGoal,
          entries: [entry],
        },
      });
    }

    return NextResponse.json({
      message: 'Intake logged successfully',
      today: {
        intake: updatedLog.intakeMl,
        goal: updatedLog.goalMl,
        percentage: Math.round((updatedLog.intakeMl / updatedLog.goalMl) * 100),
        goalMet: updatedLog.goalMet,
        entries: updatedLog.entries,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging intake:', error);
    return NextResponse.json({ error: 'Failed to log intake' }, { status: 500 });
  }
}

// DELETE - Remove last entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLog = await prisma.trackerLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!todayLog) {
      return NextResponse.json({ error: 'No entries to remove' }, { status: 404 });
    }

    const entries = (todayLog.entries as Array<{ time: string; ml: number; type: string }>) || [];
    
    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries to remove' }, { status: 404 });
    }

    // Remove last entry
    const removedEntry = entries.pop()!;
    const newIntake = Math.max(0, todayLog.intakeMl - removedEntry.ml);

    const settings = await prisma.trackerSettings.findUnique({
      where: { userId },
    });
    const dailyGoal = settings?.dailyGoalMl || 3000;

    const updatedLog = await prisma.trackerLog.update({
      where: { id: todayLog.id },
      data: {
        intakeMl: newIntake,
        goalMet: newIntake >= dailyGoal,
        entries,
      },
    });

    return NextResponse.json({
      message: 'Entry removed',
      removedAmount: removedEntry.ml,
      today: {
        intake: updatedLog.intakeMl,
        goal: updatedLog.goalMl,
        percentage: Math.round((updatedLog.intakeMl / updatedLog.goalMl) * 100),
        goalMet: updatedLog.goalMet,
        entries: updatedLog.entries,
      },
    });
  } catch (error) {
    console.error('Error removing entry:', error);
    return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
  }
}
