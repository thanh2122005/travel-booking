<!-- Chính sách hiển thị ngay chỗ đặt tour
Ngoài hủy tour, nên có: đổi lịch, hoàn tiền, điều kiện trẻ em, phụ thu lễ/tết.
User phải thấy trước khi bấm xác nhận.
ok tôi thấy hợp lý ở đây  -->

<!-- Chi tiết “bao gồm/không bao gồm” của tour
Giống ví dụ “thành phần món ăn”: tour nên có mục rõ ràng
Giá bao gồm gì / Không bao gồm gì.
có cần ko nếu có thì bổ sung nhé   -->

<!-- Điều kiện áp dụng giá
Giá đang là theo khách, nhưng chưa nói rõ: giá cho người lớn? trẻ em? phòng đơn?
Nên có block “Điều kiện giá”.
ok tôi thấy   -->


ở quản lý hóa đơn thầy toi ddag nói tương tự quản lý loại sản phẩm 1 loại sp sẽ có rất nhiều sp 1 loại sp có nhiều sp và khi bấm 1 loại sp sẽ sổ ra rất nhiều sp áp dụng vào với hóa đơn
mã đơn hàng tên ng mua địa chỉ khách hàng sđt email,.... như tôi đag ko có địa chỉ khách hàng có cần bổ sung ko nếu ko cần thì thôi nhé 
chi tiết đơn sẽ có mã sp số lượng thành tiền,....
print ra pdf để hiển thị ra danh sách sp thuộc đơn hàng đó gồm mã đơn hàng tên ng mua địa chỉ khách hàng sđt email,.... như tôi đag ko có địa chỉ khách hang


Nhãn trạng thái chỗ còn lại trên card tour
List tour nên có badge: Còn nhiều / Sắp hết / Hết chỗ (theo ngày được chọn hoặc mặc định).
Giúp user quyết định nhanh hơn.

Thông báo chính sách ngay nút hủy đơn
Ở trang đơn, cạnh nút hủy thêm note ngắn: Chỉ hủy trước 2 ngày.
Tránh user thắc mắc vì sao không hủy được

<!-- cần làm them thông báo về phía admin khi KH đặt tour ví dụ 20 người mà chỉ còn trống khoảng 19 slot khi đó khách hàng thao tác tiếp tục đặt tour sẽ có thông báo Ngày đã chọn chỉ còn 19 chỗ trống. thì khi đó sẽ phải có thông báo về phía admin ghi nhận lại để admin sẽ liên hệ lại vs khách hàng đàm phám hoặc thay đổi j đó chứ ko phải vì đã có 3 khách đặt mà bỏ 19 khách đc đúng ko đó là điều cần bổ sung  -->


và tiếp theo làm rõ hơn phần thanh toán thanh toán ở đây đag chỉ mang tính chat minh họa sẽ phải có 1 cái j đó để rang buộc là đã thanh toán ko chỉ là admin ấn trạng thái là đã thanh toán quá mơ hồ ng dùng đã thanh toán và ko nhận về đc cái j ko có vé hay j thì đến lúc tour du lịch thì lấy đâu ra vé hay 1 cái j đó rang buộc rang đã thanh toán chỉ nhìn mỗi web ghi đã thanh toán thôi à ko có vé hay j để check in các thứ à uúng ko bạn xem thử và tôi cần bổ sung các thứ như này nhé 



<!-- C. Hủy booking phải có quy tắc

Web thật không nên cho hủy thoải mái mọi lúc.

Bạn nên thêm rule kiểu:

chỉ được hủy trước ngày đi ít nhất 1 hoặc 2 ngày
nếu sát ngày thì không cho hủy online, phải liên hệ admin
khi hủy thành công thì trả lại slot

Đây là nghiệp vụ rất thực tế. -->

<!-- 
D. Có “giữ chỗ tạm” cho đoàn lớn

Case bạn nêu rất đúng thực tế.

Nếu đoàn lớn muốn đi mà thiếu chỗ, web không nên trả về cụt lủn. Nên thêm flow:

Nếu không đủ chỗ
không tạo booking chính thức
tạo một yêu cầu đặt đoàn / yêu cầu tư vấn

Ví dụ bảng mới:

group_booking_request
tourId
departureDate
groupSize
contactName
phone
email
note
status

Điều này rất thật, vì doanh nghiệp du lịch thường xử lý đoàn lớn thủ công. -->




có 1 khung chat từ ng dung cho admin và bổ sung them nhân viên để chat vs khách hang 





Phụ thu phòng đơn: 300.000 ₫/người lớn/đêm x 2 người x 2 đêm = 1.200.000 ₫
làm rõ phụ thu đag mặc định là phụ thu hết à hay j 







quản lý lịch trình tour 



Ưu tiên cao (nên làm ngay)

<!-- Endpoint public đang lộ toàn bộ yêu cầu tư vấn (không auth).
[route.ts](d:/Source Code/travel-booking/src/app/api/contact-inquiries/route.ts:140) và [route.ts](d:/Source Code/travel-booking/src/app/api/contact-inquiries/route.ts:147) -->

Luồng quên mật khẩu đang trả OTP ra client (debugOtp) và auto-fill qua URL/session.
[route.ts](d:/Source Code/travel-booking/src/app/api/auth/forgot-password/route.ts:64)
[forgot-password-form.tsx](d:/Source Code/travel-booking/src/components/auth/forgot-password-form.tsx:50)

Một số API trả lỗi kèm Debug: ra message (khi dev), dễ lộ thông tin nội bộ lúc demo local.
[route.ts](d:/Source Code/travel-booking/src/app/api/bookings/route.ts:939)
[route.ts](d:/Source Code/travel-booking/src/app/api/admin/bookings/[id]/detail/route.ts:166)

Có lỗi mã hóa tiếng Việt trong API admin check-in/activity (Không..., Đã...) ảnh hưởng UX.
[route.ts](d:/Source Code/travel-booking/src/app/api/admin/bookings/[id]/check-in/route.ts:40)
[route.ts](d:/Source Code/travel-booking/src/app/api/admin/bookings/[id]/activity/route.ts:20)

Fallback demo tự bật khi DB lỗi có thể làm dữ liệu “nhảy” sang data demo, gây hiểu lầm mất dữ liệu thật.
[public-queries.ts](d:/Source Code/travel-booking/src/lib/db/public-queries.ts:346)
[admin-queries.ts](d:/Source Code/travel-booking/src/lib/db/admin-queries.ts:1051)
[admin-queries.ts](d:/Source Code/travel-booking/src/lib/db/admin-queries.ts:1427)

Ưu tiên vừa (UI/UX nghiệp vụ)
6. Nhãn chặn hủy đang khá chung chung (Không thể hủy), nên tách rõ lý do: đã thanh toán, đã phát hành vé, quá hạn hủy.
[page.tsx](d:/Source Code/travel-booking/src/app/(user)/tai-khoan/page.tsx:117)

Ghi chú kỹ thuật
7. Lint đang fail ở file script phụ trợ (require), không phải core UI nhưng nên dọn để tránh trừ điểm khi check code quality.

Nếu bạn muốn, mình fix luôn theo gói “an toàn demo” trong 1 lượt:

khóa endpoint debug, 2) bỏ debugOtp, 3) sửa tiếng Việt lỗi mã hóa, 4) tắt fallback demo bằng env flag, 5) cải thiện message “Không thể hủy”.

