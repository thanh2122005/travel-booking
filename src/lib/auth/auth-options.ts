import { UserRole, UserStatus } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authSecret } from "@/lib/auth/auth-secret"; //giải mã 
import { db } from "@/lib/db/prisma";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { loginSchema } from "@/lib/validations/auth";

const DEV_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";

// Cấu hình NextAuth: Xử lý đăng nhập bằng Email/Password, mã hóa phiên bản bằng JWT, phân quyền User/Admin.
export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    // Lưu session/JWT: Sử dụng JWT (JSON Web Token) mã hóa phía client thay vì lưu session trong DB để giảm tải server.
    strategy: "jwt",
  },
  pages: {
    // Ghi đè trang đăng nhập mặc định của NextAuth bằng giao diện custom của dự án.
    signIn: "/dang-nhap",
  },
  providers: [
    CredentialsProvider({
      name: "Đăng nhập",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "ban@example.com",
        },
        password: {
          label: "Mật khẩu",
          type: "password",
        },
      },
      async authorize(credentials) {
        try {
          // Validate dữ liệu: Dùng Zod để kiểm tra xem email/password khách nhập có đúng định dạng không trước khi gọi DB.
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const email = parsed.data.email;
          const password = parsed.data.password;

          // Tìm user theo email do người dùng cung cấp.
          let user = await db.user.findUnique({
            where: { email },
          });

          // Fallback cấp tài khoản Admin cục bộ khi DB trống (dùng cho môi trường Dev).
          if (
            !user &&
            process.env.NODE_ENV !== "production" &&
            email === DEV_ADMIN_EMAIL &&
            password === DEV_ADMIN_PASSWORD
          ) {
            user = await db.user.create({
              data: {
                fullName: "Quản trị viên hệ thống",
                email: DEV_ADMIN_EMAIL,
                passwordHash: await bcrypt.hash(DEV_ADMIN_PASSWORD, 10),
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                phone: "0909000001",
                avatarUrl: "/immerse-vietnam/images/test-1.jpg",
              },
            });
          }

          // Chặn tài khoản bị khóa: Nếu user không tồn tại hoặc bị admin đánh dấu BLOCKED thì từ chối đăng nhập.
          if (!user || user.status === UserStatus.BLOCKED) {
            return null;
          }

          // So sánh mật khẩu bằng bcrypt: Mã hóa password người dùng nhập và so sánh với mã băm (hash) trong DB. Tuyệt đối không lưu mật khẩu gốc.
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) {
            return null;
          }

          if (user.role === UserRole.ADMIN) {
            await appendAdminActivityLog({
              action: "ADMIN_LOGIN",
              actorId: user.id,
              actorName: user.fullName || "Quản trị viên",
              detail: {
                email: user.email,
              },
            }).catch(() => undefined);
          }

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
            status: user.status,
            phone: user.phone,
          };
        } catch (error) {
          console.error("Lỗi authorize credentials:", error);
          // Fallback: Cho phép đăng nhập bằng tài khoản Dev Admin nội bộ nếu Database gặp sự cố kết nối.
          const parsed = loginSchema.safeParse(credentials);
          if (
            parsed.success &&
            process.env.NODE_ENV !== "production" &&
            parsed.data.email === DEV_ADMIN_EMAIL &&
            parsed.data.password === DEV_ADMIN_PASSWORD
          ) {
            return {
              id: "dev-admin",
              name: "Quản trị viên (chế độ cục bộ)",
              email: DEV_ADMIN_EMAIL,
              image: null,
              role: UserRole.ADMIN,
              status: UserStatus.ACTIVE,
              phone: "0909000001",
            };
          }

          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Gắn role USER/ADMIN và trạng thái vào thẳng JWT token ngay khi đăng nhập thành công.
        token.role = user.role ?? UserRole.USER;
        token.status = user.status ?? UserStatus.ACTIVE;
        token.phone = user.phone ?? null;
        token.syncedAt = Date.now();
      }

      const shouldSync =
        typeof token.syncedAt !== "number" || Date.now() - token.syncedAt > 60_000;

      if (shouldSync && token.sub && token.sub !== "dev-admin") {
        let currentUser: { role: UserRole; status: UserStatus; phone: string | null } | null = null;
        let syncFailed = false;

        try {
          currentUser = await db.user.findUnique({
            where: { id: token.sub },
            select: {
              role: true,
              status: true,
              phone: true,
            },
          });
        } catch (error) {
          syncFailed = true;
          console.error("Loi dong bo session user tu DB:", error);
        }

        if (currentUser) {
          // Đồng bộ lại quyền hiện tại từ DB (nếu admin vừa đổi quyền hoặc khóa tài khoản user đang online).
          token.role = currentUser.role;
          token.status = currentUser.status;
          token.phone = currentUser.phone;
        } else if (!syncFailed) {
          // Nếu user bị xóa khỏi DB thì tự động hạ quyền và khóa phiên đăng nhập.
          token.role = UserRole.USER;
          token.status = UserStatus.BLOCKED;
          token.phone = null;
        }
        token.syncedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Truyền các trường custom từ Token sang Session để Client-side (React components) có thể đọc được (như session.user.role).
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.USER;
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.ACTIVE;
        session.user.phone = typeof token.phone === "string" ? token.phone : null;
      }

      return session;
    },
  },
};

