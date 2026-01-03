import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AnalyticsClient from '@/components/admin/AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics | Admin Dashboard | Paaniyo',
  description: 'Platform analytics and insights for Paaniyo',
};

export default async function AdminAnalyticsPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/admin/analytics');
  }

  return <AnalyticsClient />;
}
