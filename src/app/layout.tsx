import type { Metadata } from "next";
import { ToastContainer } from "@/components/ToastContainer";
import { Sidebar } from "@/components/Sidebar";
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
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
