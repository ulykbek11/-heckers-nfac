"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function SidebarWrapper() {
  const pathname = usePathname();
  const authRoutes = ['/login', '/register', '/forgot-password'];
  
  if (authRoutes.includes(pathname)) {
    return null;
  }
  
  return (
    <>
      <Sidebar />
      <MobileNav />
    </>
  );
}
