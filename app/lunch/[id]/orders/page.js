'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './orders.module.css';
import { showError, showSuccess, showConfirm } from '@/lib/errorHandler';

export default function OrdersPage({ params }) {
  const { user, token, loading, sessionExpired } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(params.id);
  const [orders, setOrders] = useState([]);
  const [item, setItem] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedOrders, setCopiedOrders] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showVoteSummary, setShowVoteSummary] = useState(false);
  const [moneyPaidValues, setMoneyPaidValues] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const dropdownRef = useRef(null);
  const [moneyPaid, setMoneyPaid] = useState('');

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
    if (!loading && token && params.id) {
      fetchRestaurants().then(() => {
        // Set default to most voted restaurant
        setSelectedRestaurantId(params.id);
      });
      fetchLocation();
      fetchOrders();
    }
  }, [token, loading, params.id]);

  useEffect(() => {
    // Update orders when restaurant selection changes
    if (!loading && token && selectedRestaurantId) {
      fetchOrders();
    }
  }, [selectedRestaurantId, token, loading]);

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
        // Return restaurants sorted by votes (most voted first)
        return data.data.sort((a, b) => b.votes - a.votes);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
    return null;
  };

  const fetchLocation = async () => {
    try {
      const res = await fetch(`/api/lunch-locations/${selectedRestaurantId}`);

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
      // Fetch ALL orders, not filtered by location
      const res = await fetch(`/api/lunch-orders`);

      if (!res.ok) {
        console.error('Failed to fetch orders');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        // Initialize moneyPaidValues with current values
        const initialValues = {};
        data.data.forEach(order => {
          if (order.moneyPaid !== null && order.moneyPaid !== undefined) {
            initialValues[order._id] = order.moneyPaid;
          }
        });
        setMoneyPaidValues(initialValues);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async () => {
    if (!item || !cost) {
      showError('Please fill in all required fields', 'Validation Error');
      return;
    }

    if (showEditModal && !editingOrder) {
      showError('No order selected for editing', 'Validation Error');
      return;
    }

    if (showAddModal && !selectedRestaurantId) {
      showError('Please select a restaurant', 'Validation Error');
      return;
    }

    setOrdersLoading(true);

    try {
      if (showEditModal && editingOrder) {
        // Update existing order
        const bodyData = {
          item,
          cost: parseFloat(cost),
          notes,
        };

        // Include moneyPaid in the update if it's set
        if (moneyPaid !== '') {
          bodyData.moneyPaid = parseFloat(moneyPaid);
        }

        const res = await fetch(`/api/lunch-orders/${editingOrder._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('API error response:', text);
          showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Update Failed');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setOrders(orders.map((o) => (o._id === editingOrder._id ? data.data : o)));
          showSuccess('Order updated successfully!');
          setShowEditModal(false);
          setEditingOrder(null);
        } else {
          showError(data.error || 'Unknown error', 'Update Failed');
        }
      } else {
        // Create new order
        const res = await fetch('/api/lunch-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            locationId: selectedRestaurantId,
            item,
            cost: parseFloat(cost),
            notes,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('API error response:', text);
          showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Order Failed');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setOrders([data.data, ...orders]);
          showSuccess('Order created successfully!');
          setShowAddModal(false);
        } else {
          showError(data.error || 'Unknown error', 'Order Failed');
        }
      }
      setItem('');
      setCost('');
      setNotes('');
      setMoneyPaid('');
    } catch (error) {
      console.error('Error submitting order:', error);
      showError(error.message, 'Error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setItem(order.item);
    setCost(order.cost.toString());
    setNotes(order.notes || '');
    setMoneyPaid(order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid.toString() : '');
    setShowEditModal(true);
  };

  const handleDelete = async (orderId) => {
    const confirmed = await showConfirm(
      'Delete Order?',
      'Are you sure you want to delete this order? This action cannot be undone.',
      'Yes, Delete'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/lunch-orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Delete Failed');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders(orders.filter((o) => o._id !== orderId));
        showSuccess('Order deleted successfully!');
      } else {
        showError(data.error || 'Unknown error', 'Delete Failed');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showError(error.message, 'Error');
    }
  };

  const handleShareUrl = () => {
    // Share the current orders page URL
    const ordersUrl = `${window.location.origin}/lunch/${params.id}/orders`;
    navigator.clipboard.writeText(ordersUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateOrderText = () => {
    // Generate formatted text summary for all orders
    let orderText = '🍽️ LUNCH ORDERS 🍽️\n';
    orderText += `${location?.name || 'Restaurant'}\n`;
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

  const handleMoneyPaidChange = (orderId, value) => {
    // Update local state immediately for better UX
    setMoneyPaidValues(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  const handleMoneyPaidBlur = async (orderId) => {
    try {
      const value = moneyPaidValues[orderId];
      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      const moneyPaid = value === '' || value === undefined ? null : parseFloat(value);

      // Check if value actually changed
      const currentMoneyPaid = order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : null;
      if (moneyPaid === currentMoneyPaid) return;

      const res = await fetch(`/api/lunch-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          item: order.item,
          cost: order.cost,
          notes: order.notes,
          moneyPaid,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`Update failed: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders(orders.map((o) => (o._id === orderId ? data.data : o)));
        showMessage('Money paid updated', 'success');
      } else {
        showMessage(data.error || 'Update failed', 'error');
      }
    } catch (error) {
      console.error('Error updating money paid:', error);
      showMessage('Error updating money paid', 'error');
    }
  };

  const calculateDifference = (order) => {
    const paid = order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : order.cost;
    const difference = paid - order.cost;
    return { difference, paid };
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const totalCost = orders.reduce((sum, order) => sum + order.cost, 0);
  const totalPaid = orders.reduce((sum, order) => {
    const paid = order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : order.cost;
    return sum + paid;
  }, 0);
  const totalDifference = totalPaid - totalCost;

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
            <h1>{location?.name || 'Loading...'}</h1>
            <p>Register what you want to order</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowShareDropdown(!showShareDropdown)}
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
                {copiedOrders ? '✓ Copied!' : '📋 Copy Orders'}
              </button>
              {showShareDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
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
              {copied ? '✓ Copied!' : '📋 Share Link'}
            </button>
            <Link href="/lunch" className={styles.backBtn}>
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
                .filter((restaurant) => restaurant.votes > 0)
                .sort((a, b) => b.votes - a.votes)
                .map((restaurant) => (
                  <div key={restaurant._id} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.08)' }}>
                    <div className={styles.voteSummaryItem}>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{restaurant.emoji || '🍽️'}</span>
                      <span className={styles.restaurantNameSummary}>{restaurant.name}</span>
                      <span className={styles.voteCountSummary}> - {restaurant.votes} {restaurant.votes === 1 ? 'vote' : 'votes'}</span>
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

        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              setItem('');
              setCost('');
              setNotes('');
              setShowAddModal(true);
            }}
            style={{
              padding: '0.8rem 2rem',
              background: 'linear-gradient(to right, #ff6b6b, #ffd93d)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            ➕ Add New Order
          </button>
        </div>

        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#64c8ff' }}>Add New Order</h2>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Restaurant *</label>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">-- Select a restaurant --</option>
                  {restaurants
                    .sort((a, b) => b.votes - a.votes)
                    .map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.name} ({restaurant.votes} {restaurant.votes === 1 ? 'vote' : 'votes'})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Item *</label>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="What do you want to order?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Cost ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setItem('');
                    setCost('');
                    setNotes('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 107, 107, 0.2)',
                    color: '#ff6b6b',
                    border: '1px solid #ff6b6b',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={ordersLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #ff6b6b, #ffd93d)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: ordersLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                >
                  {ordersLoading ? 'Adding...' : 'Add Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editingOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#64c8ff' }}>Edit Order</h2>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Restaurant</label>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(100, 200, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                }}>
                  {editingOrder.locationId?.name || 'N/A'}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Item *</label>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="What do you want to order?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Cost ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>
                  Money Paid ($)
                  <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>
                    (leave empty to use cost)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={moneyPaid}
                  onChange={(e) => setMoneyPaid(e.target.value)}
                  placeholder={cost || '0.00'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
                {cost && moneyPaid && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    {parseFloat(moneyPaid) - parseFloat(cost) > 0 ? (
                      <span style={{ color: '#4ade80' }}>
                        Change Expected: ${(parseFloat(moneyPaid) - parseFloat(cost)).toFixed(2)}
                      </span>
                    ) : parseFloat(moneyPaid) - parseFloat(cost) < 0 ? (
                      <span style={{ color: '#ff6b6b' }}>
                        Money Owed: ${Math.abs(parseFloat(moneyPaid) - parseFloat(cost)).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: '#64c8ff' }}>Exact amount</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem' }}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                    setItem('');
                    setCost('');
                    setNotes('');
                    setMoneyPaid('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 107, 107, 0.2)',
                    color: '#ff6b6b',
                    border: '1px solid #ff6b6b',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={ordersLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #ff6b6b, #ffd93d)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: ordersLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                >
                  {ordersLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.ordersList}>
          <div className={styles.summaryHeader}>
            <h2>Orders ({orders.length})</h2>
            <span className={styles.totalCost}>Total: ${totalCost.toFixed(2)}</span>
          </div>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet. Add one above!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <thead>
                  <tr style={{ background: 'rgba(100, 200, 255, 0.15)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#64c8ff', fontWeight: '600' }}>Item</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#64c8ff', fontWeight: '600' }}>Restaurant</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#64c8ff', fontWeight: '600' }}>Ordered By</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: '#64c8ff', fontWeight: '600' }}>Cost</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: '#64c8ff', fontWeight: '600' }}>Money Paid</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: '#64c8ff', fontWeight: '600' }}>Change/Owed</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#64c8ff', fontWeight: '600' }}>Notes</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#64c8ff', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const { difference, paid } = calculateDifference(order);
                    return (
                      <tr key={order._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {order.item}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {order.locationId && (
                            <span style={{
                              padding: '0.3rem 0.6rem',
                              background: 'rgba(255, 107, 107, 0.2)',
                              color: '#ff6b6b',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                            }}>
                              {order.locationId.name}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#999' }}>{order.userId.username}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                          ${order.cost.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={order.cost.toFixed(2)}
                            value={moneyPaidValues[order._id] !== undefined ? moneyPaidValues[order._id] : (order.moneyPaid !== null && order.moneyPaid !== undefined ? order.moneyPaid : '')}
                            onChange={(e) => handleMoneyPaidChange(order._id, e.target.value)}
                            onBlur={() => handleMoneyPaidBlur(order._id)}
                            style={{
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(100, 200, 255, 0.3)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '0.9rem',
                              width: '90px',
                              textAlign: 'right',
                            }}
                          />
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '500' }}>
                          {difference > 0 ? (
                            <span style={{ color: '#4ade80' }}>+${difference.toFixed(2)}</span>
                          ) : difference < 0 ? (
                            <span style={{ color: '#ff6b6b' }}>-${Math.abs(difference).toFixed(2)}</span>
                          ) : (
                            <span style={{ color: '#999' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#999', fontSize: '0.85rem', maxWidth: '200px' }}>
                          {order.notes || '—'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {order.userId._id === user?.userId && (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEdit(order)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  background: 'rgba(100, 200, 255, 0.2)',
                                  color: '#64c8ff',
                                  border: '1px solid #64c8ff',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(order._id)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  background: 'rgba(255, 107, 107, 0.2)',
                                  color: '#ff6b6b',
                                  border: '1px solid #ff6b6b',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(100, 200, 255, 0.1)', borderTop: '2px solid rgba(100, 200, 255, 0.3)' }}>
                    <td colSpan="3" style={{ padding: '1rem', fontWeight: '600', color: '#64c8ff', fontSize: '1rem' }}>
                      TOTALS
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64c8ff', fontSize: '1rem' }}>
                      ${totalCost.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#64c8ff', fontSize: '1rem' }}>
                      ${totalPaid.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '1rem' }}>
                      {totalDifference > 0 ? (
                        <span style={{ color: '#4ade80' }}>+${totalDifference.toFixed(2)}</span>
                      ) : totalDifference < 0 ? (
                        <span style={{ color: '#ff6b6b' }}>-${Math.abs(totalDifference).toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#64c8ff' }}>$0.00</span>
                      )}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
