'use client';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Mail, Phone, Send } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/lib/services/auth';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accept digits with optional spaces, dashes, brackets — normalized before API call
const PHONE_REGEX = /^[\+\d][\d\s\-\(\)]{5,18}$/;

function detectInputType(value: string): 'email' | 'phone' | 'unknown' {
  if (!value) return 'unknown';
  if (value.includes('@')) return 'email';
  if (/^[\+\d\s\-\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 4)
    return 'phone';
  return 'unknown';
}

const forgotPasswordSchema = z
  .object({
    identifier: z.string().min(1, 'Email or phone is required'),
  })
  .refine(
    (data) =>
      EMAIL_REGEX.test(data.identifier) || PHONE_REGEX.test(data.identifier),
    {
      message: 'Please enter a valid email or phone number',
      path: ['identifier'],
    }
  );

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [identifierValue, setIdentifierValue] = useState('');

  const inputType = detectInputType(identifierValue);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const isEmail = EMAIL_REGEX.test(data.identifier);
      // Normalize phone: strip spaces, dashes, brackets before sending
      const normalizedIdentifier = isEmail
        ? data.identifier
        : data.identifier.replace(/[\s\-\(\)]/g, '');

      await authService.requestPasswordReset({
        email: isEmail ? normalizedIdentifier : undefined,
        phone: !isEmail ? normalizedIdentifier : undefined,
      });
      setSuccess(
        isEmail
          ? 'Password reset link sent! Check your email.'
          : 'Password reset OTP sent! Check your phone.'
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const { onChange: rhfOnChange, ...identifierRest } = register('identifier');

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Send className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email or phone to reset your password
            </p>
          </div>

          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError('')}
              type="error"
            />
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Smart identifier input — detection is invisible to user */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Phone
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5">
                  {inputType === 'phone' ? (
                    <Phone className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </span>

                <input
                  {...identifierRest}
                  onChange={(e) => {
                    setIdentifierValue(e.target.value);
                    rhfOnChange(e);
                  }}
                  // Always type="text" — changing type resets cursor position
                  type="text"
                  inputMode={inputType === 'phone' ? 'tel' : 'email'}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="admin@example.com or +91 98765 43210"
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}