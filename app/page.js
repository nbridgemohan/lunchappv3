'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.css';

const APP_VERSION = '1.0.0';

export default function Home() {
  const { user, token, loading, logout, sessionExpired, login } = useAuth();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [chosenRestaurant, setChosenRestaurant] = useState(null);
  const [voters, setVoters] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [copiedOrders, setCopiedOrders] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showVoteSummary, setShowVoteSummary] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const dropdownRef = useRef(null);

  // Handle SSO login - if NextAuth session exists but custom auth doesn't
  useEffect(() => {
    const handleSSOLogin = async () => {
      if (sessionStatus === 'loading' || loading) return;

      // If we have a NextAuth session but no custom auth token
      if (session && !user && !token) {
        try {
          const response = await fetch('/api/auth/sso-login', {
            method: 'POST',
          });

          const data = await response.json();

          if (data.needsProfileCompletion) {
            router.push('/complete-profile');
            return;
          }

          if (data.success && data.data) {
            // Login with custom auth system
            login(data.data, data.data.token);
          } else if (data.error) {
            // If there's an error, redirect to login
            console.error('SSO login failed:', data.error);
            router.push('/login');
          }
        } catch (error) {
          console.error('SSO login error:', error);
          // On error, redirect to login
          router.push('/login');
        }
      }
    };

    handleSSOLogin();
  }, [session, sessionStatus, user, token, loading, login, router]);

  useEffect(() => {
    if (!loading && !user && sessionStatus !== 'loading' && !session) {
      router.push('/login');
    }
  }, [user, loading, router, session, sessionStatus]);

  useEffect(() => {
    if (sessionExpired) {
      showMessage('Your session has expired. Please log in again.', 'error');
      router.push('/login');
    }
  }, [sessionExpired, router]);

  useEffect(() => {
    if (!loading && token) {
      fetchTodaysWinner();
      fetchOrders();
    }
  }, [token, loading]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowShareDropdown(false);
      }
    };

    if (showShareDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareDropdown]);

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
        setRestaurants(data.data);
      }
      setPageLoading(false);
    } catch (error) {
      console.error('Error fetching winner:', error);
      setPageLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/lunch-orders');

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

  const generateOrderText = () => {
    if (!chosenRestaurant || orders.length === 0) {
      return 'No orders yet for today!';
    }

    // Generate formatted text summary for all orders
    let orderText = '🍽️ LUNCH ORDERS 🍽️\n';
    orderText += `${chosenRestaurant.name}\n`;
    orderText += '━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    const totalCost = orders.reduce((sum, order) => sum + order.cost, 0);
    const totalPaid = orders.reduce((sum, order) => {
      const paid = order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : order.cost;
      return sum + paid;
    }, 0);
    const totalDifference = totalPaid - totalCost;

    orders.forEach((order, index) => {
      const paid = order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : order.cost;
      const difference = paid - order.cost;

      orderText += `${index + 1}. ${order.userId.username}\n`;
      orderText += `   📍 ${order.locationId?.name || 'N/A'}\n`;
      orderText += `   🍴 ${order.item}\n`;
      orderText += `   💰 Cost: $${order.cost.toFixed(2)}\n`;
      orderText += `   💵 Paid: $${paid.toFixed(2)}\n`;

      if (difference > 0) {
        orderText += `   ✅ Change: $${difference.toFixed(2)}\n`;
      } else if (difference < 0) {
        orderText += `   ⚠️ Owes: $${Math.abs(difference).toFixed(2)}\n`;
      } else {
        orderText += `   ✓ Exact amount\n`;
      }

      if (order.notes) {
        orderText += `   📝 ${order.notes}\n`;
      }
      orderText += '\n';
    });

    orderText += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
    orderText += `📊 TOTALS:\n`;
    orderText += `   Orders: ${orders.length}\n`;
    orderText += `   Total Cost: $${totalCost.toFixed(2)}\n`;
    orderText += `   Total Paid: $${totalPaid.toFixed(2)}\n`;

    if (totalDifference > 0) {
      orderText += `   Change Expected: $${totalDifference.toFixed(2)}\n`;
    } else if (totalDifference < 0) {
      orderText += `   Money Owed: $${Math.abs(totalDifference).toFixed(2)}\n`;
    }

    return orderText;
  };

  const handleCopyToClipboard = () => {
    const orderText = generateOrderText();
    navigator.clipboard.writeText(orderText);
    setCopiedOrders(true);
    setShowShareDropdown(false);
    setTimeout(() => setCopiedOrders(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const orderText = generateOrderText();
    const encodedText = encodeURIComponent(orderText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setShowShareDropdown(false);
  };

  if (loading || pageLoading) {
    return <LoadingSpinner />;
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
              <Link href="/lunch" className={styles.lunchBtn} title="Go to Lunch Voting">
                🗳️
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className={styles.logoutBtn}
                title="Logout"
              >
                🚪
              </button>
            </div>
          )}
        </div>

        {chosenRestaurant ? (
          <>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <Link href="/lunch" className={styles.orderButton}>
                🗳️ Vote Now!
              </Link>
              <Link
                href={voters.length > 0 ? `/lunch/${chosenRestaurant._id}/orders` : '/lunch'}
                className={styles.orderButton}
              >
                📋 Place Order
              </Link>
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
                    <h3>VOTERS:</h3>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                <Link
                  href={voters.length > 0 ? `/lunch/${chosenRestaurant._id}/orders` : '/lunch'}
                  className={styles.orderButton}
                >
                  {voters.length > 0 ? '📋 View Orders & Place Order' : '🗳️ Go Vote Now!'}
                </Link>
                {voters.length > 0 && (
                  <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowShareDropdown(!showShareDropdown)}
                      className={styles.copyButton}
                      style={{
                        marginTop: 0,
                      }}
                    >
                      {copiedOrders ? '✓ Copied!' : '📤 Share Orders'}
                    </button>
                    {showShareDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(20, 20, 30, 0.98)',
                        border: '1px solid rgba(100, 200, 255, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        minWidth: '200px',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                      }}>
                        <button
                          onClick={handleCopyToClipboard}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            color: '#64c8ff',
                            border: 'none',
                            borderRadius: '4px',
                            textAlign: 'left',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(100, 200, 255, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          📋 Copy to Clipboard
                        </button>
                        <button
                          onClick={handleSendWhatsApp}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            color: '#64c8ff',
                            border: 'none',
                            borderRadius: '4px',
                            textAlign: 'left',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(100, 200, 255, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          💬 Send via WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
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
