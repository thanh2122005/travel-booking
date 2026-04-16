import { createHash, randomInt, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";

export const OTP_EXPIRE_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(otp: string) {
  // Lưu hash OTP thay vì OTP plain text để tăng an toàn dữ liệu.
  return createHash("sha256").update(otp).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensurePasswordResetOtpTable() {
  // Tạo bảng OTP động cho flow demo/dev khi chưa chạy migration riêng.
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id VARCHAR(191) PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      otp_hash VARCHAR(191) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      used_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_password_reset_user_created (user_id, created_at),
      INDEX idx_password_reset_email_created (email, created_at),
      INDEX idx_password_reset_expires (expires_at)
    )
  `);
}

export async function createPasswordResetOtp(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    // Trả NOT_FOUND nhưng không ném lỗi để API dễ map ra response.
    return {
      ok: false as const,
      reason: "NOT_FOUND" as const,
    };
  }

  await ensurePasswordResetOtpTable();

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

  await db.$executeRawUnsafe(
    `
      UPDATE password_reset_otps
      SET used_at = NOW(3)
      WHERE user_id = ? AND used_at IS NULL
    `,
    user.id,
  );

  await db.$executeRawUnsafe(
    `
      INSERT INTO password_reset_otps (id, user_id, email, otp_hash, expires_at, attempts, used_at)
      VALUES (?, ?, ?, ?, ?, 0, NULL)
    `,
    randomUUID(),
    user.id,
    user.email,
    otpHash,
    expiresAt,
  );

  return {
    ok: true as const,
    email: user.email,
    otp,
    expiresAt,
  };
}

export async function resetPasswordWithOtp(input: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const email = normalizeEmail(input.email);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: false as const, reason: "NOT_FOUND" as const };
  }

  await ensurePasswordResetOtpTable();

  const rows = (await db.$queryRawUnsafe(
    `
      SELECT id, otp_hash, expires_at, attempts
      FROM password_reset_otps
      WHERE user_id = ? AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    user.id,
  )) as Array<{
    id: string;
    otp_hash: string;
    expires_at: Date;
    attempts: number;
  }>;

  const latestOtp = rows[0];
  if (!latestOtp) {
    return { ok: false as const, reason: "OTP_NOT_FOUND" as const };
  }

  const isExpired = new Date(latestOtp.expires_at).getTime() < Date.now();
  if (isExpired) {
    await db.$executeRawUnsafe(
      `UPDATE password_reset_otps SET used_at = NOW(3) WHERE id = ?`,
      latestOtp.id,
    );
    return { ok: false as const, reason: "OTP_EXPIRED" as const };
  }

  if (latestOtp.attempts >= OTP_MAX_ATTEMPTS) {
    // Khóa OTP sau nhiều lần nhập sai để chống brute-force.
    await db.$executeRawUnsafe(
      `UPDATE password_reset_otps SET used_at = NOW(3) WHERE id = ?`,
      latestOtp.id,
    );
    return { ok: false as const, reason: "OTP_LOCKED" as const };
  }

  const otpHash = hashOtp(input.otp.trim());
  if (otpHash !== latestOtp.otp_hash) {
    // Sai OTP thì tăng attempts.
    await db.$executeRawUnsafe(
      `UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?`,
      latestOtp.id,
    );
    return { ok: false as const, reason: "OTP_INVALID" as const };
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  await db.$transaction([
    // Đổi mật khẩu + đánh dấu OTP đã dùng trong cùng transaction.
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    db.$executeRawUnsafe(
      `UPDATE password_reset_otps SET used_at = NOW(3) WHERE id = ?`,
      latestOtp.id,
    ),
  ]);

  return { ok: true as const };
}
