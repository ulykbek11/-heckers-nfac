'use client';

interface PasswordStrengthProps {
  password?: string;
}

export default function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(4, Math.max(1, score)); // Min 1 if typed anything
  };

  const strength = password ? getStrength(password) : 0;
  
  const segments = Array.from({ length: 4 }).map((_, i) => {
    const isActive = i < strength;
    let color = 'bg-[#E0E0E0]';
    if (isActive) {
      if (strength === 1) color = 'bg-[#EF4444]'; // Red
      else if (strength === 2) color = 'bg-[#F97316]'; // Orange
      else if (strength === 3) color = 'bg-[#EAB308]'; // Yellow
      else if (strength === 4) color = 'bg-[#22C55E]'; // Green
    }
    return <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${color}`} />;
  });

  return (
    <div className="flex gap-1.5 mt-2">
      {segments}
    </div>
  );
}
