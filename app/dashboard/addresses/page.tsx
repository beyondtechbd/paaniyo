// app/dashboard/addresses/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AddressesClient } from '@/components/dashboard/AddressesClient';

export const metadata = {
  title: 'My Addresses | Paaniyo',
  description: 'Manage your delivery addresses',
};

async function getAddresses(userId: string) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return addresses;
}

export default async function AddressesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/dashboard/addresses');
  }

  const addresses = await getAddresses(session.user.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <AddressesClient initialAddresses={addresses} />
    </main>
  );
}
