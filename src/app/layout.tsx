import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: {
    default: "Immersive Vietnam - Đặt tour du lịch Việt Nam",
    template: "%s | Immersive Vietnam",
  },
  description:
    "Nền tảng đặt tour du lịch Việt Nam hiện đại, tối ưu trải nghiệm người dùng và quản trị dữ liệu thực tế.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
