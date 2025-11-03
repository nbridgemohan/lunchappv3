'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

const APP_VERSION = '1.0.0';

export default function Home() {
  const { user, token, loading, logout, sessionExpired } = useAuth();
  const router = useRouter();

  const [chosenRestaurant, setChosenRestaurant] = useState(null);
  const [voters, setVoters] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (sessionExpired) {
      showMessage('Your session has expired. Please log in again.', 'error');
      router.push('/login');
    }
  }, [sessionExpired, router]);

  useEffect(() => {
    if (!loading && token) {
      fetchTodaysWinner();
    }
  }, [token, loading]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleShareUrl = () => {
    const url = `${window.location.origin}/lunch/${chosenRestaurant._id}/summary`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTodaysWinner = async () => {
    try {
      const res = await fetch('/api/lunch-locations');

      if (!res.ok) {
        setPageLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const winner = data.data[0];
        setChosenRestaurant(winner);
        setVoters(winner.voters || []);
      }
      setPageLoading(false);
    } catch (error) {
      console.error('Error fetching winner:', error);
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <main className={styles.main}>
      {message && (
        <div className={`${styles.notification} ${styles[messageType]}`}>
          {message}
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Lunch Dashboard</h1>
            <p>Today's lunch coordination</p>
          </div>
          {user && (
            <div className={styles.userInfo}>
              <span>Welcome, {user.username}!</span>
              <Link href="/lunch" className={styles.lunchBtn}>
                Go to Lunch Voting
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className={styles.logoutBtn}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {chosenRestaurant ? (
          <>
            <div className={styles.winnerContainer}>
              {chosenRestaurant.logoUrl && voters.length > 0 && (
                <div className={styles.winnerLogo}>
                  <img src={chosenRestaurant.logoUrl} alt={chosenRestaurant.name} />
                </div>
              )}
              {voters.length > 0 ? (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {chosenRestaurant.emoji || '🍽️'}
                  </div>
                  <div className={styles.winnerTrophy}>🏆</div>
                  <h2 className={styles.winnerTitle}>{chosenRestaurant.name}</h2>
                </>
              ) : (
                <>
                  <div className={styles.awaitingVotes}>🤔</div>
                  <h2 className={styles.winnerTitle} style={{ color: '#ffd93d' }}>What's for Lunch Today?</h2>
                  <p className={styles.awaitingVotesText}>{chosenRestaurant.name} is waiting for votes...</p>
                </>
              )}
              {chosenRestaurant.description && voters.length > 0 && (
                <p className={styles.winnerDescription}>{chosenRestaurant.description}</p>
              )}
              {voters.length > 0 && (
                <>
                  <div className={styles.votersList}>
                    <h3>Team is going to:</h3>
                    <div className={styles.voters}>
                      {voters.map((voter, index) => (
                        <div key={voter._id} className={styles.voterBadge}>
                          <span className={styles.voterNumber}>{index + 1}</span>
                          <span className={styles.voterName}>{voter.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.votesSummary}>
                    <span className={styles.voteCount}>{voters.length} {voters.length === 1 ? 'person' : 'people'} voted</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                <Link
                  href={voters.length > 0 ? `/lunch/${chosenRestaurant._id}/summary` : '/lunch'}
                  className={styles.orderButton}
                >
                  {voters.length > 0 ? '📋 Order Summary & Add Orders' : '🗳️ Go Vote Now!'}
                </Link>
                {voters.length > 0 && (
                  <button
                    onClick={handleShareUrl}
                    style={{
                      padding: '0.6rem 1.2rem',
                      background: 'linear-gradient(to right, #ff6b6b, #ffd93d)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>🤔 No restaurants have been voted on yet.</p>
            <Link href="/lunch" className={styles.lunchBtn}>
              Go vote for a restaurant!
            </Link>
          </div>
        )}

        <div className={styles.version}>v{APP_VERSION}</div>
      </div>
    </main>
  );
}
