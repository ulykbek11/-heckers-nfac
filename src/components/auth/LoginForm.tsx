'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import OAuthButtons from './OAuthButtons';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    if (!email) return 'Обязательное поле';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Введите корректный email';
    return '';
  };

  const validatePassword = () => {
    if (!password) return 'Обязательное поле';
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    if (field === 'email') setErrors(prev => ({ ...prev, email: validateEmail() }));
    if (field === 'password') setErrors(prev => ({ ...prev, password: validatePassword() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail();
    const passErr = validatePassword();
    
    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setErrors({ general: 'Неверный email или пароль' });
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const inputClass = (error?: string) => `
    w-full h-[40px] px-3 border rounded-lg text-[14px] outline-none transition-all
    ${error 
      ? 'border-[#EF4444] focus:box-shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' 
      : 'border-[#E0E0E0] focus:border-[#6366F1] focus:box-shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
    }
  `;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">С возвращением</h1>
        <p className="text-[#666] text-sm">Войдите в свой аккаунт</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="you@example.com"
            disabled={loading}
            className={inputClass(errors.email)}
          />
          {errors.email && <p className="text-[#EF4444] text-[12px] mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Пароль</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              disabled={loading}
              className={inputClass(errors.password)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[#EF4444] text-[12px] mt-1">{errors.password}</p>}
        </div>

        <div className="flex justify-end mt-[-8px]">
          <Link href="/forgot-password" className="text-[13px] text-[#6366F1] font-medium hover:underline">
            Забыли пароль?
          </Link>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full h-[42px] mt-2 bg-[#1a1a1a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors disabled:opacity-70 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Войти'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E0E0E0]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 text-[12px]">или</span>
        </div>
      </div>

      <OAuthButtons />

      <div className="mt-8 text-center">
        <p className="text-[14px] text-[#666]">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-[#1a1a1a] font-semibold hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
