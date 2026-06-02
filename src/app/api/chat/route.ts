// API Chatbot thông minh: Trả lời khách hàng dựa trên dữ liệu Tour thực tế trong CSDL.
// Không phụ thuộc bất kỳ API bên ngoài nào (offline 100%).

import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

// Hàm format giá tiền VNĐ
function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

// Hàm tìm kiếm tour theo từ khóa trong CSDL
async function searchTours(keyword: string) {
  try {
    const tours = await db.tour.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { title: { contains: keyword } },
          { shortDescription: { contains: keyword } },
          { departureLocation: { contains: keyword } },
        ],
      },
      select: {
        title: true,
        price: true,
        discountPrice: true,
        durationDays: true,
        durationNights: true,
        departureLocation: true,
        shortDescription: true,
        location: { select: { name: true } },
      },
      take: 3,
    });
    return tours;
  } catch {
    return [];
  }
}

// Hàm lấy tour nổi bật
async function getFeaturedTours() {
  try {
    const tours = await db.tour.findMany({
      where: { status: "ACTIVE", featured: true },
      select: {
        title: true,
        price: true,
        discountPrice: true,
        durationDays: true,
        durationNights: true,
        location: { select: { name: true } },
      },
      take: 3,
    });
    return tours;
  } catch {
    return [];
  }
}

// Hàm lấy danh sách địa điểm
async function getLocations() {
  try {
    const locations = await db.location.findMany({
      select: { name: true, provinceOrCity: true },
      take: 10,
    });
    return locations;
  } catch {
    return [];
  }
}

// Hàm lấy tour giá rẻ nhất
async function getCheapestTours() {
  try {
    const tours = await db.tour.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ discountPrice: "asc" }, { price: "asc" }],
      select: {
        title: true,
        price: true,
        discountPrice: true,
        durationDays: true,
        location: { select: { name: true } },
      },
      take: 3,
    });
    return tours;
  } catch {
    return [];
  }
}

// Xử lý câu hỏi của khách hàng bằng pattern matching thông minh
async function generateReply(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();

  // 1. Chào hỏi
  if (/^(hi|hello|xin chào|chào|hey|alo)/.test(msg)) {
    return "Xin chào bạn! 👋 Tôi là trợ lý ảo của Immersive Vietnam. Tôi có thể giúp bạn:\n\n• Tìm kiếm tour du lịch\n• Xem tour nổi bật\n• Xem các điểm đến\n• Hướng dẫn đặt tour\n• Giải đáp thắc mắc\n\nBạn cần hỗ trợ gì ạ?";
  }

  // 2. Hỏi về tour nổi bật / gợi ý
  if (/(tour nổi bật|tour hot|gợi ý|đề xuất|tour hay|nên đi|tour nào)/.test(msg)) {
    const tours = await getFeaturedTours();
    if (tours.length === 0) {
      return "Hiện tại chưa có tour nổi bật nào. Bạn có thể ghé trang Tour để xem tất cả nhé!";
    }
    let reply = "🌟 Đây là các tour nổi bật của chúng tôi:\n\n";
    tours.forEach((t, i) => {
      const price = t.discountPrice ?? t.price;
      reply += `${i + 1}. **${t.title}**\n   📍 ${t.location.name} | ⏱ ${t.durationDays} ngày ${t.durationNights} đêm\n   💰 ${formatPrice(price)}\n\n`;
    });
    reply += "Bạn có muốn xem chi tiết tour nào không ạ?";
    return reply;
  }

  // 3. Hỏi về điểm đến / địa điểm
  if (/(điểm đến|địa điểm|đi đâu|tỉnh|thành phố|miền)/.test(msg)) {
    const locations = await getLocations();
    if (locations.length === 0) {
      return "Xin lỗi, tôi chưa tải được danh sách điểm đến. Bạn hãy xem tại mục Điểm đến trên thanh menu nhé!";
    }
    let reply = "📍 Các điểm đến hấp dẫn:\n\n";
    locations.forEach((l, i) => {
      reply += `${i + 1}. ${l.name} (${l.provinceOrCity})\n`;
    });
    reply += "\nBạn muốn tìm tour ở điểm đến nào ạ?";
    return reply;
  }

  // 4. Hỏi về giá / tour rẻ
  if (/(giá|bao nhiêu|rẻ|tiết kiệm|chi phí|phí|tốn)/.test(msg)) {
    const tours = await getCheapestTours();
    if (tours.length === 0) {
      return "Xin lỗi, tôi chưa lấy được thông tin giá. Bạn hãy xem tại trang Tour nhé!";
    }
    let reply = "💰 Tour giá tốt nhất hiện tại:\n\n";
    tours.forEach((t, i) => {
      const price = t.discountPrice ?? t.price;
      reply += `${i + 1}. **${t.title}** - ${formatPrice(price)} (${t.durationDays} ngày)\n`;
    });
    reply += "\nGiá trên là giá cho 1 người lớn. Trẻ em 5-7 tuổi được giảm 50%, dưới 5 tuổi miễn phí!";
    return reply;
  }

  // 5. Hướng dẫn đặt tour
  if (/(đặt tour|book|cách đặt|làm sao đặt|mua tour|đăng ký tour)/.test(msg)) {
    return "📝 Hướng dẫn đặt tour:\n\n1️⃣ Chọn tour yêu thích tại mục **Tour**\n2️⃣ Bấm nút **Đặt tour ngay**\n3️⃣ Điền thông tin: họ tên, email, số điện thoại, số khách\n4️⃣ Chọn ngày khởi hành và loại phòng\n5️⃣ Xác nhận đặt tour\n\n💡 Lưu ý: Bạn cần đăng nhập trước khi đặt tour nhé!";
  }

  // 6. Hỏi về thanh toán
  if (/(thanh toán|payment|trả tiền|chuyển khoản|tiền)/.test(msg)) {
    return "💳 Thông tin thanh toán:\n\nHiện tại, hệ thống hỗ trợ hình thức **Thanh toán khi xác nhận**. Sau khi đặt tour, đội ngũ tư vấn sẽ liên hệ xác nhận và hướng dẫn thanh toán chi tiết.\n\nBạn có thắc mắc gì thêm không ạ?";
  }

  // 7. Hỏi về liên hệ / hỗ trợ
  if (/(liên hệ|hotline|điện thoại|email|hỗ trợ|tư vấn|contact)/.test(msg)) {
    return "📞 Thông tin liên hệ:\n\nBạn có thể gửi yêu cầu tư vấn tại mục **Liên hệ** trên thanh menu. Đội ngũ tư vấn sẽ phản hồi trong thời gian sớm nhất!\n\nNgoài ra, bạn có thể bấm nút **Yêu cầu tư vấn** ngay trên trang chi tiết tour.";
  }

  // 8. Hỏi về tài khoản
  if (/(đăng ký|đăng nhập|tài khoản|account|sign up|login|mật khẩu)/.test(msg)) {
    return "👤 Hướng dẫn tài khoản:\n\n• **Đăng ký**: Bấm nút Đăng ký ở góc phải, điền email và mật khẩu\n• **Đăng nhập**: Dùng email và mật khẩu đã đăng ký\n• **Quên mật khẩu**: Liên hệ bộ phận hỗ trợ qua mục Liên hệ\n\nSau khi đăng nhập, bạn có thể đặt tour, xem lịch sử và quản lý hồ sơ cá nhân!";
  }

  // 9. Cảm ơn
  if (/(cảm ơn|thank|cám ơn|tks|thnks)/.test(msg)) {
    return "Không có gì ạ! 😊 Rất vui được hỗ trợ bạn. Chúc bạn có chuyến du lịch vui vẻ! Nếu cần thêm gì, đừng ngại hỏi tôi nhé!";
  }

  // 10. Tạm biệt
  if (/(tạm biệt|bye|goodbye|bai)/.test(msg)) {
    return "Tạm biệt bạn! 👋 Hẹn gặp lại. Chúc bạn một ngày tốt lành!";
  }

  // 11. Tìm kiếm tour theo từ khóa trong tin nhắn
  const keywords = ["đà nẵng", "hà nội", "sapa", "phú quốc", "nha trang", "đà lạt", "hội an", "huế", "hạ long", "sài gòn", "miền tây", "côn đảo", "quy nhơn", "phan thiết", "mũi né", "tây nguyên", "biển", "núi", "rừng"];
  for (const kw of keywords) {
    if (msg.includes(kw)) {
      const tours = await searchTours(kw);
      if (tours.length > 0) {
        let reply = `🔍 Tìm thấy ${tours.length} tour liên quan đến "${kw}":\n\n`;
        tours.forEach((t, i) => {
          const price = t.discountPrice ?? t.price;
          reply += `${i + 1}. **${t.title}**\n   📍 ${t.location.name} | ⏱ ${t.durationDays} ngày ${t.durationNights} đêm\n   💰 ${formatPrice(price)}\n\n`;
        });
        reply += "Bạn muốn biết thêm chi tiết tour nào ạ?";
        return reply;
      }
    }
  }

  // 12. Fallback - không hiểu câu hỏi
  return "Cảm ơn bạn đã nhắn tin! 😊 Tôi có thể hỗ trợ bạn về:\n\n• Gõ **\"tour nổi bật\"** để xem gợi ý\n• Gõ **\"điểm đến\"** để xem danh sách\n• Gõ **\"đặt tour\"** để xem hướng dẫn\n• Gõ **\"giá\"** để xem tour giá tốt\n• Hoặc gõ tên địa điểm (VD: Đà Nẵng, Sapa...)\n\nHãy thử nhé!";
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Xin lỗi, tin nhắn không hợp lệ." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const reply = await generateReply(lastMessage);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json({
      reply: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau nhé!",
    });
  }
}
