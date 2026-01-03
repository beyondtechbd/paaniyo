'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      verifyEmail();
    } else {
      setStatus('resend');
    }
  }, [token, email]);

  const verifyEmail = async () => {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email!)}`);
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch {
      setStatus('error');
      setMessage('Failed to verify email');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send email');
      }
    } catch {
      setMessage('Failed to send email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <span className="text-3xl">💧</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Paaniyo
            </span>
          </Link>

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto" />
              <h1 className="text-xl font-semibold text-white">
                Verifying your email...
              </h1>
              <p className="text-gray-400">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Email Verified!
              </h1>
              <p className="text-gray-400">
                {message || 'Your email has been verified successfully.'}
              </p>
              <p className="text-gray-500 text-sm">
                Redirecting to dashboard...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Verification Failed
              </h1>
              <p className="text-gray-400">
                {message || 'Unable to verify your email address.'}
              </p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Resend Verification Email
              </button>
            </motion.div>
          )}

          {status === 'resend' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Verify Your Email
              </h1>
              <p className="text-gray-400">
                Click the button below to receive a new verification email.
              </p>
              {message && (
                <p className={`text-sm ${message.includes('sent') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
              <button
                onClick={handleResend}
                disabled={resending}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Verification Email
              </button>
            </motion.div>
          )}

          {/* Back to Dashboard Link */}
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
