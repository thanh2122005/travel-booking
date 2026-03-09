import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: {
    default: "Travel Booking System",
    template: "%s | Travel Booking System",
  },
  description: "Nền tảng đặt tour du lịch hiện đại, tối ưu trải nghiệm người dùng.",
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
