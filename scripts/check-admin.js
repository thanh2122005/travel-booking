/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

function loadFallbackDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envExamplePath = path.join(process.cwd(), ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    return;
  }

  const content = fs.readFileSync(envExamplePath, "utf8");
  const match = content.match(/^(?:\uFEFF)?DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) {
    return;
  }

  const raw = match[1].trim();
  const cleaned = raw.replace(/^['"]|['"]$/g, "");
  if (cleaned) {
    process.env.DATABASE_URL = cleaned;
  }
}

loadFallbackDatabaseUrl();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";

  if (!process.env.DATABASE_URL) {
    throw new Error("Thiếu biến môi trường DATABASE_URL.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!user) {
    console.log(`Không tìm thấy user ${email} trong DB hiện tại.`);
    process.exit(2);
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  console.log("Tìm thấy user admin:");
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Status: ${user.status}`);
  console.log(`Mật khẩu khớp: ${passwordOk ? "ĐÚNG" : "SAI"}`);

  if (!passwordOk) {
    process.exit(3);
  }
}

main()
  .catch((error) => {
    console.error("Không thể kiểm tra admin:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
