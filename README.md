# Travel Booking System

Production-like full-stack travel booking project built with Next.js App Router, TypeScript, Prisma, and PostgreSQL.
Default UI language is Vietnamese.

## 1. Main Features

### Public area
- Modern home page and brand pages
- Tour listing with search/filter/sort
- Tour detail page with itinerary, reviews, related tours
- Destination listing/detail pages
- Gallery, inspiration, about, contact pages

### Auth + User area
- Register/Login with credentials
- Profile and account dashboard
- Booking flow with booking history
- Favorites management
- Review create/update flow

### Admin area
- Admin dashboard with KPI cards and revenue/order chart
- Manage tours, locations, bookings, users, reviews
- Manage consultation requests and newsletter subscribers
- Bulk actions and CSV export for admin modules
- Role/status protections for critical admin actions

## 2. Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- Prisma ORM + PostgreSQL
- NextAuth (Credentials)
- Zod + React Hook Form
- bcryptjs

## 3. Project Structure

```text
src/
  app/
    (public)/
    (auth)/
    (user)/
    admin/
    api/
  components/
    admin/
    booking/
    common/
    layout/
    tour/
    ui/
  lib/
    auth/
    db/
    validations/
    utils/
prisma/
public/
```

## 4. Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## 5. Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
copy .env.example .env
```

Required variables:
- `DATABASE_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 6. Install and Run (Local)

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open: `http://localhost:3000`

## 7. Demo Accounts

- Admin: `admin@example.com` / `Admin@123`
- User: `user1@example.com` / `12345678`

## 8. Useful Scripts

- `npm run dev` - run local app
- `npm run build` - build production
- `npm run start` - run production build
- `npm run lint` - run ESLint
- `npx tsc --noEmit` - run TypeScript check
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

## 9. Deploy to Vercel

1. Create PostgreSQL database (Neon/Supabase/etc.)
2. Set Vercel environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
   - `NEXTAUTH_URL`
3. Deploy repository to Vercel
4. Run migration on production:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 10. Security Notes

- Passwords are hashed with bcryptjs
- Admin APIs are protected by admin guard
- User-sensitive APIs require authenticated active user
- Input validation via Zod
- No real payment gateway integration (student project scope)

## 11. Future Improvements

- Integrate payment provider (optional future)
- Add image upload service (S3/Cloudinary)
- Add audit logs for admin actions
- Add e2e tests and CI deployment checks
