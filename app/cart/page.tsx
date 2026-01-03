// app/cart/page.tsx
import { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartPageClient';

export const metadata: Metadata = {
  title: 'Cart | Paaniyo',
  description: 'Your shopping cart',
};

export default function CartPage() {
  return <CartClient />;
}
