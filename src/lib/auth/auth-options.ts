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

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    // Dùng JWT để không cần session store riêng trong DB.
    strategy: "jwt",
  },
  pages: {
    // Trang đăng nhập custom của hệ thống.
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
          // Validate đầu vào trước khi đụng DB.
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const email = parsed.data.email;
          const password = parsed.data.password;

          let user = await db.user.findUnique({
            where: { email },
          });

          // Dev bootstrap: tự tạo tài khoản admin mặc định nếu chưa có user trong DB.
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

          if (!user || user.status === UserStatus.BLOCKED) {
            // Không cho đăng nhập nếu không tồn tại hoặc đã bị khóa.
            return null;
          }

          // So khớp mật khẩu plain text với hash lưu trong DB.
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
          // Fallback cho môi trường dev khi DB chưa sẵn sàng:
          // vẫn cho phép đăng nhập admin mặc định để tiếp tục kiểm tra UI.
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
        // Gắn role/status vào JWT ngay tại thời điểm đăng nhập.
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
          // Đồng bộ lại quyền hiện tại từ DB để tránh token cũ sai quyền.
          token.role = currentUser.role;
          token.status = currentUser.status;
          token.phone = currentUser.phone;
        } else if (!syncFailed) {
          // Nếu user không còn tồn tại thì hạ quyền và khóa phiên.
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
        // Đẩy các trường custom từ token ra session cho client sử dụng.
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.USER;
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.ACTIVE;
        session.user.phone = typeof token.phone === "string" ? token.phone : null;
      }

      return session;
    },
  },
};

