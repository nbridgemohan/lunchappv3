'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../orders/orders.module.css';
import { showError } from '@/lib/errorHandler';

export default function SummaryPage({ params }) {
  const { user, token, loading, sessionExpired } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showVoteSummary, setShowVoteSummary] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (sessionExpired) {
      showError('Your session has expired. Please log in again.', 'Session Expired');
      router.push('/login');
    }
  }, [sessionExpired, router]);

  useEffect(() => {
    if (!loading && token && params.id) {
      fetchRestaurants();
      fetchLocation();
      fetchOrders();
    }
  }, [token, loading, params.id]);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/lunch-locations');

      if (!res.ok) {
        console.error('Failed to fetch restaurants');
        return null;
      }

      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
    return null;
  };

  const fetchLocation = async () => {
    try {
      const res = await fetch(`/api/lunch-locations/${params.id}`);

      if (!res.ok) {
        console.error('Failed to fetch location');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocation(data.data);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/lunch-orders?locationId=${params.id}`);

      if (!res.ok) {
        console.error('Failed to fetch orders');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleShareUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const totalCost = orders.reduce((sum, order) => sum + order.cost, 0);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Order Summary</h1>
            <p>{location?.name || 'Loading...'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleShareUrl}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(100, 200, 255, 0.2)',
                color: '#64c8ff',
                border: '1px solid #64c8ff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Share'}
            </button>
            <Link href={`/lunch/${params.id}/orders`} style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(100, 200, 255, 0.2)',
              color: '#64c8ff',
              border: '1px solid #64c8ff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}>
              ➕ Add/Edit Orders
            </Link>
            <Link href="/lunch" style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(100, 200, 255, 0.2)',
              color: '#64c8ff',
              border: '1px solid #64c8ff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}>
              Back to Voting
            </Link>
          </div>
        </div>

        {restaurants.length > 0 && (
          <div className={styles.voteSummary}>
            <button
              type="button"
              onClick={() => setShowVoteSummary(!showVoteSummary)}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 217, 61, 0.1))',
                border: '2px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                color: '#ff6b6b',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                marginBottom: '1rem',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', width: '24px' }}>
                {showVoteSummary ? '▼' : '▶'}
              </span>
              <span>📊 Vote Summary</span>
            </button>
            {showVoteSummary && (
            <div className={styles.voteSummaryList}>
              {restaurants
                .sort((a, b) => b.votes - a.votes)
                .map((restaurant) => (
                  <div key={restaurant._id} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.08)' }}>
                    <div className={styles.voteSummaryItem}>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{restaurant.emoji || '🍽️'}</span>
                      <span className={styles.restaurantNameSummary}>{restaurant.name}</span>
                      <span className={styles.voteCountSummary}>{restaurant.votes} {restaurant.votes === 1 ? 'vote' : 'votes'}</span>
                    </div>
                    {restaurant.voters && restaurant.voters.length > 0 && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 107, 107, 0.2)' }}>
                        <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem' }}>Voted by:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {restaurant.voters.map((voter) => (
                            <span
                              key={voter._id}
                              style={{
                                display: 'inline-block',
                                padding: '0.4rem 0.8rem',
                                background: 'rgba(100, 200, 255, 0.15)',
                                color: '#64c8ff',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                              }}
                            >
                              {voter.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            )}
          </div>
        )}

        <div className={styles.ordersList}>
          <div className={styles.summaryHeader}>
            <h2>Orders ({orders.length})</h2>
            <span className={styles.totalCost}>Total: ${totalCost.toFixed(2)}</span>
          </div>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet.</p>
          ) : (
            <div className={styles.ordersContainer}>
              {orders.map((order) => (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderHeader}>
                      <h3>{order.item}</h3>
                      <span className={styles.cost}>${order.cost.toFixed(2)}</span>
                    </div>
                    {order.notes && (
                      <p className={styles.notes}>Notes: {order.notes}</p>
                    )}
                    <p className={styles.orderedBy}>
                      by {order.userId.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href={`/lunch/${params.id}/orders`} style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(to right, #ff6b6b, #ffd93d)',
            color: '#000',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            display: 'inline-block',
          }}>
            ➕ Add/Edit Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
