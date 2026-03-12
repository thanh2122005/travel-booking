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
- Trang cảm hứng và thư viện ảnh có lọc/phân trang theo điểm đến
- Form liên hệ hỗ trợ prefill theo tour/điểm đến từ luồng tư vấn nhanh
- Cụm tours/điểm đến/inspiration/gallery/booking/favorites/reviews có thao tác nhanh mobile để nhảy tới bộ lọc và danh sách kết quả

### Khu vực người dùng

- Đăng ký, đăng nhập
- Đặt tour trực tiếp từ trang chi tiết tour
- Yêu thích tour
- Gửi/cập nhật đánh giá
- Dashboard tài khoản: lịch sử booking, danh sách yêu thích, đánh giá cá nhân
- Bộ lọc nhanh nâng cao cho đơn đặt tour/yêu thích/đánh giá trong trang tài khoản
- Trang chi tiết tour có thanh thao tác nhanh trên mobile (đặt tour/tư vấn nhanh)
- Dashboard tài khoản có điều hướng nhanh theo section và thanh thao tác cố định trên mobile

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

Lưu ý bảo mật:

- Ở môi trường production, bắt buộc phải cấu hình `AUTH_SECRET` hoặc `NEXTAUTH_SECRET`.
- Ứng dụng sẽ dừng sớm nếu thiếu secret để tránh chạy với cấu hình không an toàn.

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

## 9. Cấu trúc thư mục chính

```text
src/
  app/
    (public)/        # Trang công khai
    (user)/          # Dashboard người dùng
    admin/           # Khu vực quản trị
    api/             # API route (user/admin)
  components/
    admin/           # UI/logic cho admin
    booking/
    favorite/
    review/
    tour/
  lib/
    auth/            # NextAuth + guard quyền truy cập
    db/              # Query server cho public/user/admin
    demo/            # Fallback dữ liệu demo khi DB không sẵn sàng
    validations/     # Schema Zod
```

## 10. Bảo mật API và phân quyền

- Tất cả API quản trị đi qua guard admin và middleware `/api/admin/:path*`.
- API user quan trọng (`booking`, `favorites`, `reviews`, `account/profile`) dùng guard chung để:
  - bắt buộc đăng nhập
  - chặn tài khoản `BLOCKED`
- Guard quyền user/admin ưu tiên đồng bộ role + status theo DB (fallback session khi DB tạm lỗi ở dev/demo).
- Khu vực `/admin` chặn truy cập theo role + status ngay từ middleware.

## 11. Checklist trước khi deploy

1. Đồng bộ biến môi trường production (`DATABASE_URL`, `NEXTAUTH_URL`, secret).
2. Chạy kiểm tra chất lượng:
   - `npm run lint`
   - `npx tsc --noEmit`
3. Chạy migration production:
   - `npx prisma migrate deploy`
4. Seed dữ liệu mẫu nếu cần:
   - `npx prisma db seed`

## 12. Xử lý lỗi thường gặp

- `Error: spawn EPERM` khi `next build` trên môi trường bị hạn chế quyền:
  - Thử chạy terminal với quyền phù hợp (hoặc môi trường CI khác).
  - Xác nhận phần mềm bảo mật không chặn tiến trình con của Node.js.
  - Dùng `npm run lint` + `npx tsc --noEmit` để xác minh logic mã nguồn trước khi chuyển môi trường build.
