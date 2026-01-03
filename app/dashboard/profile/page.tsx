// app/dashboard/profile/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from '@/components/dashboard/ProfileClient';

export const metadata = {
  title: 'My Profile | Paaniyo',
  description: 'Manage your account settings and personal information',
};

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/dashboard/profile');
  }

  const user = await getProfile(session.user.id);

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <ProfileClient user={user} />
    </main>
  );
}
