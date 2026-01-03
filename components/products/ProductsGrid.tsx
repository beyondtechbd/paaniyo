// components/products/ProductsGrid.tsx
'use client';

import { motion } from 'framer-motion';
import { ProductCard } from '@/components/home/ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  image: string;
  category: string;
  stock: number;
  avgRating: number | null;
  reviewCount: number;
  featured: boolean;
  freeShipping: boolean;
  tags: string[];
  volumeMl: number | null;
  discount: number;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    country: string | null;
  } | null;
}

interface ProductsGridProps {
  products: Product[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product, index) => (
        <motion.div key={product.id} variants={item}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}
