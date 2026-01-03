import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import UsersClient from '@/components/admin/UsersClient';

export const metadata: Metadata = {
  title: 'User Management - Admin | Paaniyo',
  description: 'Manage platform users',
};

export default async function AdminUsersPage() {
  // Get initial counts
  const [customerCount, vendorCount, adminCount, suspendedCount] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'VENDOR' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isSuspended: true } }),
  ]);

  return (
    <UsersClient
      initialCounts={{
        customer: customerCount,
        vendor: vendorCount,
        admin: adminCount,
        suspended: suspendedCount,
        total: customerCount + vendorCount + adminCount,
      }}
    />
  );
}
