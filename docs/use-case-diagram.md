# Use Case Diagram (Tổng quát)

```mermaid
usecaseDiagram
  actor Guest as "Khách vãng lai"
  actor User as "Người dùng"
  actor Admin as "Quản trị viên"

  rectangle "Hệ thống đặt tour Immersive Vietnam" {
    (Xem trang chủ / danh sách tour) as UC_BROWSE
    (Xem chi tiết tour) as UC_TOUR_DETAIL
    (Đăng ký tài khoản) as UC_REGISTER
    (Đăng nhập / Đăng xuất) as UC_AUTH
    (Quên mật khẩu) as UC_FORGOT

    (Đặt tour) as UC_BOOK
    (Xem đơn của tôi) as UC_MY_BOOKING
    (Hủy đơn khi còn chờ xác nhận) as UC_CANCEL
    (Gửi đánh giá tour) as UC_REVIEW
    (Lưu tour yêu thích) as UC_FAVORITE
    (Gửi yêu cầu tư vấn) as UC_INQUIRY
    (Đăng ký nhận tin) as UC_NEWSLETTER

    (Xem dashboard quản trị) as UC_DASHBOARD
    (Quản lý tour) as UC_ADMIN_TOUR
    (Quản lý điểm đến) as UC_ADMIN_LOCATION
    (Quản lý đơn đặt tour) as UC_ADMIN_BOOKING
    (Cập nhật trạng thái thanh toán/đơn) as UC_ADMIN_STATUS
    (Phát hành vé / mã check-in) as UC_TICKET
    (Đánh dấu check-in) as UC_CHECKIN
    (Quản lý đánh giá) as UC_ADMIN_REVIEW
    (Quản lý tư vấn liên hệ) as UC_ADMIN_INQUIRY
    (Quản lý newsletter) as UC_ADMIN_NEWS
    (Quản lý thành viên) as UC_ADMIN_USER
    (Xem nhật ký hoạt động) as UC_ADMIN_LOG
  }

  Guest --> UC_BROWSE
  Guest --> UC_TOUR_DETAIL
  Guest --> UC_REGISTER
  Guest --> UC_AUTH
  Guest --> UC_FORGOT
  Guest --> UC_INQUIRY
  Guest --> UC_NEWSLETTER

  User --> UC_BROWSE
  User --> UC_TOUR_DETAIL
  User --> UC_AUTH
  User --> UC_BOOK
  User --> UC_MY_BOOKING
  User --> UC_CANCEL
  User --> UC_REVIEW
  User --> UC_FAVORITE
  User --> UC_INQUIRY
  User --> UC_NEWSLETTER

  Admin --> UC_DASHBOARD
  Admin --> UC_ADMIN_TOUR
  Admin --> UC_ADMIN_LOCATION
  Admin --> UC_ADMIN_BOOKING
  Admin --> UC_ADMIN_STATUS
  Admin --> UC_TICKET
  Admin --> UC_CHECKIN
  Admin --> UC_ADMIN_REVIEW
  Admin --> UC_ADMIN_INQUIRY
  Admin --> UC_ADMIN_NEWS
  Admin --> UC_ADMIN_USER
  Admin --> UC_ADMIN_LOG

  UC_BOOK .> UC_AUTH : <<include>>
  UC_CANCEL .> UC_MY_BOOKING : <<extend>>
  UC_ADMIN_STATUS .> UC_ADMIN_BOOKING : <<include>>
  UC_TICKET .> UC_ADMIN_STATUS : <<extend>>
  UC_CHECKIN .> UC_TICKET : <<extend>>
```

## Gợi ý đưa vào báo cáo
- Đặt sơ đồ này ở mục **Phân tích hệ thống / Use Case Diagram**.
- Chú thích ngắn:
  - `Guest`: khách chưa đăng nhập.
  - `User`: khách đã có tài khoản và đặt tour.
  - `Admin`: quản trị vận hành hệ thống.
