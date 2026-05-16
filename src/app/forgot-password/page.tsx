import AuthLayout from '@/components/auth/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сброс пароля | Damka',
  description: 'Сброс пароля от аккаунта Damka',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
