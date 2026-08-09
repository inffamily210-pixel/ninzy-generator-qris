'use client';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-3 rounded-xl font-medium text-sm transition ${
        active
          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950'
          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
