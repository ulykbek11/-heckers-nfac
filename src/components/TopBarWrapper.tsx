"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";

export function TopBarWrapper() {
  const pathname = usePathname();
  const authRoutes = ['/login', '/register', '/forgot-password'];
  
  if (authRoutes.includes(pathname)) {
    return null;
  }
  
  return <TopBar />;
}
