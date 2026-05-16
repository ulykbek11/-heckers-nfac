import type { Metadata } from "next";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { AuthModal } from "@/components/AuthModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Damka - Checkers Web App",
  description: "Play checkers online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#F7F6F3]">
        <SidebarWrapper />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {children}
        </div>
        <AuthModal />
      </body>
    </html>
  );
}
