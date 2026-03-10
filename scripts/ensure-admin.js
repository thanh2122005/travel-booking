/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole, UserStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const fullName = process.env.ADMIN_FULL_NAME || "Quản trị viên hệ thống";
  const phone = process.env.ADMIN_PHONE || "0909000001";
  const avatarUrl =
    process.env.ADMIN_AVATAR_URL || "https://api.dicebear.com/9.x/notionists/svg?seed=admin";

  if (!process.env.DATABASE_URL) {
    throw new Error("Thiếu biến môi trường DATABASE_URL. Hãy tạo file .env trước.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      avatarUrl,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      fullName,
      email,
      phone,
      avatarUrl,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("Đã sẵn sàng tài khoản admin:");
  console.log(`Email: ${email}`);
  console.log(`Mật khẩu: ${password}`);
  console.log(`Role: ${user.role} | Status: ${user.status}`);
}

main()
  .catch((error) => {
    console.error("Không thể tạo admin:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
