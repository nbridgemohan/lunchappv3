'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/lib/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from '../login/auth.module.css';

export default function CompleteProfilePage() {
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('BGL IT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { login } = useAuth();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Suggest username from email
    if (session.user?.email) {
      const suggestedUsername = session.user.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
      setUsername(suggestedUsername);
    }

    setCheckingProfile(false);
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, hyphens and underscores');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, organization }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to complete profile');
        return;
      }

      // Profile completed successfully, login with the custom auth system
      if (data.success && data.data) {
        login(data.data, data.data.token);

        // Small delay to ensure state is updated
        setTimeout(() => {
          router.push('/');
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile || status === 'loading') {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Complete Your Profile</h1>
        <p className={styles.subtitle}>
          Welcome! Please choose your username to get started
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              className={styles.input}
              pattern="[a-z0-9_-]+"
              minLength={3}
              maxLength={30}
            />
            <small style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              3-30 characters, lowercase letters, numbers, hyphens and underscores only
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organization">Organization</label>
            <select
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
              className={styles.input}
            >
              <option value="BGL IT">BGL IT</option>
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Completing Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
