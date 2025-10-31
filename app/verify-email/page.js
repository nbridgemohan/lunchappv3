'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './verify.module.css';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setError('Invalid verification link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Verification failed');
          return;
        }

        setSuccess(data.message || 'Email verified successfully!');
        setTimeout(() => router.push('/login'), 2000);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Email Verification</h1>

        {loading && (
          <div className={styles.loading}>
            <p>Verifying your email...</p>
          </div>
        )}

        {error && (
          <>
            <div className={styles.error}>{error}</div>
            <div className={styles.links}>
              <Link href="/register" className={styles.link}>
                Back to Register
              </Link>
            </div>
          </>
        )}

        {success && (
          <>
            <div className={styles.success}>{success}</div>
            <p className={styles.redirect}>Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
