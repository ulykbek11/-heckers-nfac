'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordForm() {
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = () => {
    if (!email) return 'Обязательное поле';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Введите корректный email';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailErr = validateEmail();
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (resetError) {
      setError('Не удалось отправить письмо. Проверьте правильность email.');
      setLoading(false);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-[#6366F1]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Письмо отправлено!</h1>
        <p className="text-[#666] text-[14px] mb-8">
          Проверьте почту <span className="font-semibold text-[#1a1a1a]">{email}</span> и перейдите по ссылке для сброса пароля
        </p>
        <Link 
          href="/login" 
          className="w-full h-[42px] bg-[#1a1a1a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors flex items-center justify-center"
        >
          Вернуться к входу
        </Link>
      </div>
    );
  }

  const inputClass = (err?: string) => `
    w-full h-[40px] px-3 border rounded-lg text-[14px] outline-none transition-all
    ${err 
      ? 'border-[#EF4444] focus:box-shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' 
      : 'border-[#E0E0E0] focus:border-[#6366F1] focus:box-shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
    }
  `;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Сброс пароля</h1>
        <p className="text-[#666] text-sm">Введите email и мы отправим ссылку</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setError(validateEmail())}
            placeholder="you@example.com"
            disabled={loading}
            className={inputClass(error)}
          />
          {error && <p className="text-[#EF4444] text-[12px] mt-1">{error}</p>}
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full h-[42px] mt-2 bg-[#1a1a1a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors disabled:opacity-70 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Отправить ссылку'
          )}
        </button>
      </form>

      <div className="mt-8 flex justify-center">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-[14px] text-[#666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к входу
        </Link>
      </div>
    </div>
  );
}
