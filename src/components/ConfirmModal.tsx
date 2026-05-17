"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

export function ConfirmModal() {
  const { confirmModal, closeConfirmModal } = useAppStore();

  if (!confirmModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl p-6"
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button
              onClick={closeConfirmModal}
              className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                closeConfirmModal();
              }}
              className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Подтвердить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}