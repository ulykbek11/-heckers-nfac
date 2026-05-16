"use client";

import { useEffect, useState } from "react";

export function ToastContainer() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToast(customEvent.detail);
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-[10px] text-[13px] z-50 transition-opacity">
      {toast}
    </div>
  );
}

export function showToast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: message }));
  }
}
