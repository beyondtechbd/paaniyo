// app/tracker/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TrackerClient } from '@/components/tracker/TrackerClient';

export const metadata = {
  title: 'Water Tracker | Paaniyo',
  description: 'Track your daily water intake and stay hydrated with Paaniyo',
};

async function getTrackerData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [settings, todayLog, weekLogs] = await Promise.all([
    // Get or create settings
    prisma.trackerSettings.upsert({
      where: { userId },
      create: {
        userId,
        dailyGoalMl: 3000,
        reminderEnabled: true,
        reminderTimes: ['08:00', '12:00', '16:00', '20:00'],
        glassSize: 250,
      },
      update: {},
    }),
    
    // Today's log
    prisma.trackerLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    }),
    
    // Last 7 days
    prisma.trackerLog.findMany({
      where: {
        userId,
        date: {
          gte: weekAgo,
        },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    checkDate.setHours(0, 0, 0, 0);
    
    const log = weekLogs.find(l => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === checkDate.getTime();
    });
    
    // For today, we haven't completed yet, so skip in streak calculation
    if (i === 0 && log && log.intakeMl >= settings.dailyGoalMl * 0.8) {
      streak++;
    } else if (i > 0 && log && log.intakeMl >= settings.dailyGoalMl * 0.8) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Format week data for chart
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const log = weekLogs.find(l => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === date.getTime();
    });
    
    weekData.push({
      date: date.toISOString(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      intake: log?.intakeMl || 0,
      goal: settings.dailyGoalMl,
      percentage: Math.round(((log?.intakeMl || 0) / settings.dailyGoalMl) * 100),
    });
  }

  return {
    settings: {
      dailyGoal: settings.dailyGoalMl,
      glassSize: settings.glassSize,
      reminderEnabled: settings.reminderEnabled,
      reminderTimes: settings.reminderTimes as string[],
    },
    today: {
      intake: todayLog?.intakeMl || 0,
      goal: settings.dailyGoalMl,
      percentage: Math.round(((todayLog?.intakeMl || 0) / settings.dailyGoalMl) * 100),
      entries: (todayLog?.entries as Array<{ time: string; ml: number; type: string }>) || [],
      goalMet: todayLog?.goalMet || false,
    },
    streak,
    weekData,
  };
}

export default async function TrackerPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/tracker');
  }

  const data = await getTrackerData(session.user.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-primary/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <TrackerClient initialData={data} />
    </main>
  );
}
