import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/admin/SettingsClient';

export const metadata = {
  title: 'Platform Settings | Admin Dashboard',
  description: 'Configure platform settings for Paaniyo',
};

function SettingsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
    </div>
  );
}

export default async function AdminSettingsPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsClient />
    </Suspense>
  );
}
