# Travel Booking System

Nền tảng đặt tour du lịch xây dựng bằng Next.js App Router, Prisma và PostgreSQL.
Toàn bộ giao diện người dùng được chuẩn hóa tiếng Việt.

## 1. Công nghệ chính

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma ORM + PostgreSQL
- NextAuth (credentials)
- Tailwind CSS + Base UI
- Sonner (toast)

## 2. Tính năng hiện có

### Khu vực công khai

- Trang chủ, danh sách tour, chi tiết tour, địa điểm, giới thiệu, liên hệ
- Bộ lọc/tìm kiếm tour theo điểm đến, giá, thời lượng, sắp xếp
- Xem đánh giá và tour liên quan

### Khu vực người dùng

- Đăng ký, đăng nhập
- Đặt tour trực tiếp từ trang chi tiết tour
- Yêu thích tour
- Gửi/cập nhật đánh giá
- Dashboard tài khoản: lịch sử booking, danh sách yêu thích, đánh giá cá nhân

### Khu vực quản trị (`/admin`)

- Dashboard tổng quan vận hành
- Biểu đồ doanh thu/đơn đặt theo mốc thời gian (ngày/tuần/tháng)
- KPI theo kỳ lọc và bảng top tour theo doanh thu xác nhận
- Quản lý booking: lọc nâng cao theo ngày + cập nhật hàng loạt
- Quản lý review: lọc nâng cao theo ngày + ẩn/hiện hàng loạt
- Xuất CSV booking/review theo bộ lọc đang áp dụng
- Bảo vệ quyền admin: không cho hạ quyền/khóa/xóa quản trị viên cuối cùng
- CRUD users, tours, locations, ảnh tour, itinerary

## 3. Yêu cầu môi trường

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## 4. Cài đặt local

### Bước 1: cài dependencies

```bash
npm install
```

### Bước 2: cấu hình biến môi trường

Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

Giá trị cần cập nhật:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Bước 3: migrate + seed dữ liệu

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Bước 4: chạy ứng dụng

```bash
npm run dev
```

Truy cập: `http://localhost:3000`

## 5. Tài khoản mẫu sau khi seed

- Admin: `admin@example.com` / `Admin@123`
- User mẫu: `user1@example.com` / `12345678`

## 6. Scripts chính

- `npm run dev`: chạy local
- `npm run build`: build production
- `npm run start`: chạy production build
- `npm run lint`: kiểm tra lint
- `npm run prisma:generate`: generate Prisma Client
- `npm run prisma:migrate`: chạy migration ở local/dev
- `npm run prisma:push`: đồng bộ schema nhanh (không migration file)
- `npm run prisma:seed`: seed dữ liệu mẫu

## 7. Deploy production (gợi ý Vercel + PostgreSQL)

### 7.1 Chuẩn bị database

Tạo PostgreSQL trên Neon/Supabase/Railway hoặc máy chủ riêng, lấy `DATABASE_URL`.

### 7.2 Cấu hình Environment Variables trên Vercel

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (URL production)

### 7.3 Deploy code

- Kết nối repository với Vercel
- Build command mặc định: `npm run build`
- Install command mặc định: `npm install`

### 7.4 Chạy migrate/seed production

Sau khi deploy lần đầu, chạy một lần trên môi trường production:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 8. Ghi chú vận hành

- Không commit file `.env`
- Nếu thay đổi schema Prisma: tạo migration và kiểm tra lại seed
- Trước khi push: chạy tối thiểu `npm run lint`
