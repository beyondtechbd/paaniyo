# 💧 Paaniyo - Premium Hydration Marketplace

A modern e-commerce platform for premium bottled water and hydration products in Bangladesh. Built with Next.js 15, React 19, Tailwind CSS v4, and PostgreSQL.

## 🌟 Features

### Customer Features
- 🛒 **Shopping** - Browse products, add to cart, wishlist, checkout
- 🔍 **Search** - Full-text search with filters and autocomplete
- 📦 **Orders** - Track orders, view history, download invoices
- 👤 **Dashboard** - Manage profile, addresses, preferences
- 💧 **Water Tracker** - PWA for tracking daily water intake
- ⭐ **Reviews** - Rate and review products
- 🏷️ **Promo Codes** - Apply discounts at checkout

### Vendor Features
- 📊 **Dashboard** - Sales analytics, revenue charts
- 📝 **Products** - CRUD operations with images and variants
- 📋 **Orders** - View and process orders, update status
- 💰 **Earnings** - Track earnings, request payouts
- 🏪 **Brand** - Manage brand page (logo, banner, story)
- ⚙️ **Settings** - Business info, payout details

### Admin Features
- 📈 **Analytics** - Platform-wide revenue, users, orders charts
- 👥 **Users** - Manage customers (view, edit, suspend)
- 🏭 **Vendors** - Approve/reject/suspend vendor applications
- 📦 **Products** - View all products, filter by status/category
- 📋 **Orders** - Manage all orders, update status, tracking
- ✍️ **Reviews** - Moderate product reviews
- 🎫 **Promos** - Create and manage promotional codes
- ⚙️ **Settings** - Platform configuration (commission, shipping, features)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19 with Server Components
- **Styling**: Tailwind CSS v4 with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials + OAuth)
- **Payments**: SSLCommerz (Bangladesh)
- **Email**: Resend / SendGrid
- **Storage**: Cloudflare R2 (images)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon, Supabase, or local)
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/paaniyo.git
   cd paaniyo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
paaniyo/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── brands/             # Brand pages
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── dashboard/          # Customer dashboard
│   ├── orders/             # Order management
│   ├── product/            # Product detail
│   ├── products/           # Product listing
│   ├── search/             # Search results
│   ├── tracker/            # Water tracker PWA
│   ├── vendor/             # Vendor dashboard
│   └── wishlist/           # Customer wishlist
├── components/             # React components
│   ├── admin/              # Admin UI components
│   ├── brands/             # Brand components
│   ├── cart/               # Cart components
│   ├── checkout/           # Checkout components
│   ├── dashboard/          # Dashboard components
│   ├── home/               # Homepage components
│   ├── layout/             # Layout components
│   ├── product/            # Product components
│   ├── products/           # Product list components
│   ├── search/             # Search components
│   ├── tracker/            # Water tracker components
│   ├── ui/                 # UI primitives
│   └── vendor/             # Vendor components
├── lib/                    # Utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── email.ts            # Email service
│   ├── prisma.ts           # Prisma client
│   ├── rate-limit.ts       # Rate limiting
│   ├── sslcommerz.ts       # Payment integration
│   ├── utils.ts            # Helper functions
│   └── validations.ts      # Zod schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── public/                 # Static assets
```

## 🔐 Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret key |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `SSLCOMMERZ_STORE_ID` | Payment gateway store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | Payment gateway password |
| `EMAIL_API_KEY` | Email provider API key |
| `R2_*` | Cloudflare R2 credentials |

## 📊 Database Schema

The database includes 20+ models:

- **User** - Customer accounts with roles
- **Vendor** - Vendor profiles and status
- **Brand** - Brand information and assets
- **Product** - Products with variants
- **Category** - Product categories
- **Order** / **OrderItem** - Orders and line items
- **Review** - Product reviews and ratings
- **Cart** / **CartItem** - Shopping cart
- **Wishlist** - Customer wishlists
- **Address** - Shipping addresses
- **PromoCode** - Promotional discounts
- **Payout** - Vendor payouts
- **TrackerLog** - Water tracker data
- **Notification** - User notifications
- And more...

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Prisma Studio (database GUI)
npm run db:studio
```

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works with any platform supporting Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted

## 🗺️ Roadmap

- [x] Core e-commerce functionality
- [x] Vendor dashboard
- [x] Admin dashboard
- [x] Email verification & password reset
- [x] Search with filters
- [x] Water tracker PWA
- [ ] Push notifications
- [ ] Image upload UI
- [ ] Advanced analytics
- [ ] Multi-language support (Bangla)
- [ ] Mobile app (React Native)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📞 Support

- Email: support@paaniyo.com
- Documentation: https://docs.paaniyo.com

---

Built with 💙 in Bangladesh
