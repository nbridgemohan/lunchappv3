'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PieChart from '@/components/PieChart';
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
            <div className={styles.winnerSection}>
              <h2>🎉 Today's Winner: {chosenRestaurant.name}</h2>
              {chosenRestaurant.description && (
                <p className={styles.description}>{chosenRestaurant.description}</p>
              )}
              <p className={styles.voteCount}>
                Votes: {chosenRestaurant.votes}
              </p>
            </div>

            <div className={styles.chartSection}>
              <h3>Voting Breakdown</h3>
              <PieChart restaurant={chosenRestaurant} voters={voters} />
            </div>

            <Link
              href={`/lunch/${chosenRestaurant._id}/orders`}
              className={styles.ordersLink}
            >
              View/Add Orders
            </Link>
          </>
        ) : (
          <div className={styles.empty}>
            <p>No restaurants have been voted on yet.</p>
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
