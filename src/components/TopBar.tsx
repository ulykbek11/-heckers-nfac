export function TopBar({ title }: { title: string }) {
  return (
    <header className="h-[60px] bg-white border-b border-[#EBEBEA] flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      <h1 className="text-[15px] font-semibold">{title}</h1>
      
      <div className="flex items-center gap-3">
        <button className="px-4 py-1.5 rounded-[8px] border border-[#EBEBEA] text-[13px] font-semibold hover:bg-gray-50 transition-colors">
          Войти
        </button>
        <button className="px-4 py-1.5 rounded-[8px] bg-black text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors">
          Регистрация
        </button>
      </div>
    </header>
  );
}
