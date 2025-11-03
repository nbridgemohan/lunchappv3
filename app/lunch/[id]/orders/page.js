'use client';

import { useState, useEffect } from 'react';
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
  const [editingId, setEditingId] = useState(null);

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
      fetchRestaurants();
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
        return;
      }

      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
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
      const res = await fetch(`/api/lunch-orders?locationId=${selectedRestaurantId}`);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrdersLoading(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/lunch-orders/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ item, cost: parseFloat(cost), notes }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('API error response:', text);
          showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Update Failed');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setOrders(orders.map((o) => (o._id === editingId ? data.data : o)));
          setEditingId(null);
          showSuccess('Order updated successfully!');
        } else {
          showError(data.error || 'Unknown error', 'Update Failed');
        }
      } else {
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
        } else {
          showError(data.error || 'Unknown error', 'Order Failed');
        }
      }
      setItem('');
      setCost('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting order:', error);
      showError(error.message, 'Error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleEdit = (order) => {
    setItem(order.item);
    setCost(order.cost.toString());
    setNotes(order.notes || '');
    setEditingId(order._id);
  };

  const handleCancel = () => {
    setItem('');
    setCost('');
    setNotes('');
    setEditingId(null);
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

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const totalCost = orders.reduce((sum, order) => sum + order.cost, 0);

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
          <Link href="/lunch" className={styles.backBtn}>
            Back to Voting
          </Link>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.restaurantSelect}>
            <label htmlFor="restaurant">Restaurant:</label>
            <select
              id="restaurant"
              value={selectedRestaurantId}
              onChange={(e) => {
                setSelectedRestaurantId(e.target.value);
                setLocation(restaurants.find((r) => r._id === e.target.value) || null);
              }}
              className={styles.selectInput}
            >
              <option value="">-- Select a restaurant --</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="What do you want to order?"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
            className={styles.input}
          />
          <div className={styles.costNotes}>
            <input
              type="number"
              placeholder="Cost ($)"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              step="0.01"
              min="0"
              required
              className={styles.input}
            />
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={ordersLoading}
              className={styles.submitBtn}
            >
              {ordersLoading ? 'Saving...' : editingId ? 'Update Order' : 'Add Order'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className={styles.ordersList}>
          <div className={styles.summaryHeader}>
            <h2>Orders ({orders.length})</h2>
            <span className={styles.totalCost}>Total: ${totalCost.toFixed(2)}</span>
          </div>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet. Add one above!</p>
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
                  {order.userId._id === user?._id && (
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEdit(order)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
