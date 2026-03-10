import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: {
    default: "Immersive Vietnam Booking",
    template: "%s | Immersive Vietnam Booking",
  },
  description: "Nền tảng đặt tour du lịch Việt Nam hiện đại, premium và dễ mở rộng theo dữ liệu thật.",
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
