'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail } from 'lucide-react';
import OAuthButtons from './OAuthButtons';
import Link from 'next/link';

type Step = 'form' | 'check-email';

export default function RegisterForm() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'username':
        if (!value.trim()) return 'Обязательное поле';
        if (value.trim().length < 3) return 'Минимум 3 символа';
        return '';
      case 'email':
        if (!value) return 'Обязательное поле';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Введите корректный email';
        return '';
      case 'password':
        if (!value) return 'Обязательное поле';
        if (value.length < 8) return 'Минимум 8 символов';
        return '';
      case 'confirmPassword':
        if (!value) return 'Обязательное поле';
        if (value !== password) return 'Пароли не совпадают';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      username: validateField('username', username),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };

    if (Object.values(newErrors).some(err => err)) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // Check if username is taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle();

    if (existingProfile) {
      setErrors({ username: 'Это имя уже занято' });
      setLoading(false);
      return;
    }

    // Store username in metadata so callback can reliably create the profile
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      const msg =
        error.message.includes('already registered') ||
        error.message.includes('User already registered')
          ? 'Этот email уже зарегистрирован. Попробуйте войти.'
          : `Ошибка при регистрации: ${error.message}`;
      setErrors({ general: msg });
      setLoading(false);
      return;
    }

    // Show "check your email" screen
    setStep('check-email');
    setLoading(false);
  };

  const inputClass = (error?: string) =>
    `w-full h-[40px] px-3 border rounded-lg text-[14px] outline-none transition-all
    ${
      error
        ? 'border-[#EF4444]'
        : 'border-[#E0E0E0] focus:border-[#6366F1]'
    }`;

  if (step === 'check-email') {
    return (
      <div className="w-full flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
          <Mail className="w-8 h-8 text-[#6366F1]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Проверьте почту</h1>
        <p className="text-[#666] text-sm max-w-xs">
          Мы отправили письмо на&nbsp;<strong>{email}</strong>. Перейдите по ссылке
          в&nbsp;письме, чтобы подтвердить аккаунт и начать играть.
        </p>
        <p className="text-[#999] text-xs">
          Не пришло? Проверьте папку «Спам» или&nbsp;
          <button
            className="text-[#6366F1] hover:underline"
            onClick={() => setStep('form')}
          >
            попробуйте снова
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Создайте аккаунт</h1>
        <p className="text-[#666] text-sm">Начните играть и отслеживать прогресс</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Username */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">
            Имя пользователя
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onBlur={e => handleBlur('username', e.target.value)}
            placeholder="chess_master_99"
            disabled={loading}
            className={inputClass(errors.username)}
          />
          {errors.username ? (
            <p className="text-[#EF4444] text-[12px] mt-1">{errors.username}</p>
          ) : (
            <p className="text-[#999] text-[11px] mt-1">Будет отображаться в рейтинге</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={e => handleBlur('email', e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            className={inputClass(errors.email)}
          />
          {errors.email && (
            <p className="text-[#EF4444] text-[12px] mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (confirmPassword) handleBlur('confirmPassword', confirmPassword);
              }}
              onBlur={e => handleBlur('password', e.target.value)}
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
          {errors.password && (
            <p className="text-[#EF4444] text-[12px] mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={e => handleBlur('confirmPassword', e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={inputClass(errors.confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[#EF4444] text-[12px] mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[42px] mt-2 bg-[#1a1a1a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors disabled:opacity-70 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Создать аккаунт'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E0E0E0]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 text-[12px]">или</span>
        </div>
      </div>

      <OAuthButtons />

      <div className="mt-8 text-center">
        <p className="text-[14px] text-[#666]">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-[#1a1a1a] font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
