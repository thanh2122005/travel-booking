import { UserRole, UserStatus } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: parsed.data.email,
          },
        });

        if (!user || user.status === UserStatus.BLOCKED) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? UserRole.USER;
        token.status = user.status ?? UserStatus.ACTIVE;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.USER;
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.ACTIVE;
      }

      return session;
    },
  },
};
