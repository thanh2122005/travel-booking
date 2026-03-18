# Immersive Vietnam - Travel Booking System

Đồ án web du lịch full-stack (production-like) xây dựng bằng **Next.js App Router + TypeScript + Prisma + PostgreSQL**.
Mặc định giao diện hiển thị bằng **tiếng Việt**.

## 1) Tính năng chính

### Public
- Trang chủ, tour, điểm đến, thư viện, giới thiệu, liên hệ
- Tìm kiếm/lọc/sắp xếp danh sách tour
- Chi tiết tour/điểm đến

### Người dùng
- Đăng ký/đăng nhập bằng email + mật khẩu
- Quản lý hồ sơ
- Đặt tour và xem lịch sử booking
- Yêu thích tour
- Đánh giá tour

### Quản trị
- Dashboard KPI + biểu đồ doanh thu/đơn
- Quản lý tour, điểm đến, đơn đặt, người dùng, đánh giá
- Quản lý yêu cầu tư vấn và email nhận tin
- Bulk actions + xuất CSV

## 2) Công nghệ sử dụng

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react + framer-motion
- Prisma ORM + PostgreSQL
- NextAuth Credentials
- Zod + React Hook Form
- bcryptjs

## 3) Cấu trúc thư mục

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
    location/
    tour/
    ui/
  lib/
    auth/
    db/
    demo/
    utils/
    validations/
prisma/
public/
scripts/
```

## 4) Yêu cầu môi trường

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## 5) Cấu hình biến môi trường

Sao chép file mẫu:

```bash
copy .env.example .env
```

Điền các biến bắt buộc:

- `DATABASE_URL`
- `AUTH_SECRET` (hoặc `NEXTAUTH_SECRET`)
- `NEXTAUTH_URL`

## 6) Chạy local

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Mở: [http://localhost:3000](http://localhost:3000)

## 7) Tài khoản test

- Admin: `admin@example.com` / `Admin@123`
- User: `user1@example.com` / `12345678`

## 8) Scripts hữu ích

- `npm run dev`: chạy local
- `npm run build`: build production
- `npm run start`: chạy production
- `npm run lint`: ESLint
- `npx tsc --noEmit`: Type check
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:deploy`

## 9) Deploy Vercel

1. Tạo database PostgreSQL (Neon/Supabase)
2. Set env trên Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET` (hoặc `NEXTAUTH_SECRET`)
   - `NEXTAUTH_URL`
3. Deploy từ GitHub repo
4. Chạy migrate/seed trên môi trường deploy:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 10) Kiểm thử nhanh sau khi seed

1. Đăng nhập admin vào `/admin`
2. Kiểm tra dashboard có số liệu và biểu đồ
3. Vào các module admin:
   - `/admin/users`
   - `/admin/bookings`
   - `/admin/reviews`
   - `/admin/inquiries`
4. Thử filter + bulk action + xuất CSV
5. Đăng nhập user và thử đặt tour, yêu thích, đánh giá

## 11) Lưu ý kỹ thuật

- Mật khẩu đã hash bằng bcryptjs
- API admin có guard phân quyền
- Validate dữ liệu bằng Zod
- Không tích hợp cổng thanh toán thật (chỉ mô phỏng trạng thái)

## 12) Troubleshooting

### Lỗi không kết nối DB
- Kiểm tra `DATABASE_URL`
- Đảm bảo PostgreSQL đang chạy

### Lỗi không đăng nhập được
- Kiểm tra `AUTH_SECRET`/`NEXTAUTH_SECRET`
- Kiểm tra `NEXTAUTH_URL`

### Lỗi build trên môi trường local Windows (`spawn EPERM`)
- Thường do quyền tiến trình/sandbox trên môi trường hiện tại
- Thử chạy lại terminal với quyền phù hợp
- Xác nhận `npm run lint` và `npx tsc --noEmit` đều pass trước khi deploy

## 13) Hướng mở rộng

- Upload ảnh thật (S3/Cloudinary)
- Dashboard analytics nâng cao
- Audit logs cho admin
- e2e tests + CI pipeline
