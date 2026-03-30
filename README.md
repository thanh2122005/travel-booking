# Immersive Vietnam

Immersive Vietnam là đồ án web đặt tour du lịch, xây dựng bằng `Next.js`, `TypeScript`, `Prisma` và `MySQL`. Hệ thống có 2 phần chính: giao diện cho người dùng đặt tour và khu vực quản trị để quản lý tour, booking, người dùng, đánh giá, yêu cầu tư vấn và danh sách nhận tin.

## Chức năng chính

- Người dùng có thể xem tour, tìm kiếm, đăng ký tài khoản, đăng nhập, đặt tour, lưu tour yêu thích và viết đánh giá.
- Quản trị viên có thể vào trang admin để xem thống kê, quản lý tour, điểm đến, booking, review, liên hệ và newsletter.

## Công nghệ sử dụng

- `Next.js 16` + `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Prisma ORM`
- `MySQL`
- `NextAuth`

## Cách chạy dự án

Yêu cầu:
- `Node.js 20+`
- `npm 10+`
- `MySQL` đang chạy, có thể dùng XAMPP

Tạo file môi trường:

```bash
copy .env.example .env
```

Chạy project:

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Sau đó mở `http://localhost:3000`.

## Tài khoản test

Đây là các tài khoản mẫu dùng để demo và kiểm thử trong đồ án:

- Tài khoản quản trị: `admin@example.com` / `Admin@123`
- Tài khoản người dùng: `user1@example.com` / `12345678`

## Cấu trúc thư mục chính

```text
src/app         giao diện và API
src/components  các component dùng lại
src/lib         auth, truy vấn DB, validate
prisma          schema và seed dữ liệu
public          ảnh, font, tài nguyên tĩnh
postman         collection test API
scripts         script hỗ trợ
```

## Một số lệnh thường dùng

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## Lưu ý

- File cấu hình mẫu nằm ở `.env.example`.
- Nếu đăng ký hoặc đăng nhập lỗi, cần kiểm tra MySQL trong XAMPP đã bật chưa.
- Thư mục `postman/` chứa file test API của dự án.
