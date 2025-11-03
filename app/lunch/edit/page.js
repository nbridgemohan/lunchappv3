'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../lunch.module.css';
import { showError, showSuccess, showConfirm } from '@/lib/errorHandler';

export default function EditPage() {
  const { user, token, loading, sessionExpired } = useAuth();
  const router = useRouter();

  const FOOD_EMOJIS = ['🍕', '🍔', '🍟', '🌮', '🌯', '🥗', '🍜', '🍱', '🍛', '🍝', '🍲', '🥘', '🍣', '🍤', '🍗', '🌭', '🥪', '🍖', '🌶️', '🥠', '🍚', '🥟'];

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmoji, setEditEmoji] = useState('🍽️');

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
    if (!loading && token) {
      fetchLocations();
    }
  }, [token, loading]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/lunch-locations');

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showError(`Failed to fetch locations: HTTP ${res.status}`, 'Fetch Error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      } else {
        showError(data.error || 'Unknown error', 'Fetch Error');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showError('Error fetching locations: ' + error.message, 'Error');
    }
  };

  const handleOpenEditModal = (location) => {
    setEditingId(location._id);
    setEditName(location.name);
    setEditDescription(location.description || '');
    setEditEmoji(location.emoji || '🍽️');
  };

  const handleCloseEditModal = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditEmoji('🍽️');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      const res = await fetch(`/api/lunch-locations/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, description: editDescription, emoji: editEmoji }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Update Failed');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations(locations.map((loc) => (loc._id === editingId ? data.data : loc)));
        handleCloseEditModal();
        showSuccess('Restaurant updated successfully!');
      } else {
        showError(data.error || 'Unknown error', 'Update Failed');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      showError(error.message, 'Error');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    const location = locations.find((loc) => loc._id === locationId);
    const confirmed = await showConfirm(
      'Delete Restaurant?',
      `Are you sure you want to delete "${location?.name}"? This action cannot be undone.`,
      'Yes, Delete'
    );
    if (!confirmed) return;

    try {
      setLocationsLoading(true);
      const res = await fetch(`/api/lunch-locations/${locationId}`, {
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
        setLocations(locations.filter((loc) => loc._id !== locationId));
        showSuccess('Restaurant deleted successfully!');
      } else {
        showError(data.error || 'Unknown error', 'Delete Failed');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      showError(error.message, 'Error');
    } finally {
      setLocationsLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const userRestaurants = locations.filter((loc) => {
    const createdById = typeof loc.createdBy === 'string' ? loc.createdBy : loc.createdBy?._id;
    return createdById === user?.userId;
  });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Restaurant Management</h1>
            <p>Edit or delete your restaurants</p>
          </div>
          <Link href="/lunch" className={styles.backBtn}>
            Back to Voting
          </Link>
        </div>

        <div className={styles.votingSection}>
          {userRestaurants.length === 0 ? (
            <p className={styles.empty}>You haven't created any restaurants yet.</p>
          ) : (
            <div className={styles.locationsList}>
              {userRestaurants
                .sort((a, b) => b.votes - a.votes)
                .map((location) => (
                  <div key={location._id} className={styles.locationCard}>
                    <div className={styles.restaurantLogo}>
                      {location.logoUrl ? (
                        <img src={location.logoUrl} alt={location.name} />
                      ) : (
                        <span className={styles.logoEmoji}>{location.emoji || '🍽️'}</span>
                      )}
                    </div>
                    <div className={styles.locationInfo}>
                      <div className={styles.locationHeader}>
                        <h3>{location.name}</h3>
                        <span className={styles.votes}>{location.votes} votes</span>
                      </div>
                      {location.description && (
                        <p className={styles.description}>{location.description}</p>
                      )}
                      <p className={styles.createdBy}>
                        Created on {new Date(location.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleOpenEditModal(location)}
                        className={styles.editBtn}
                        title="Edit restaurant"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location._id)}
                        disabled={locationsLoading}
                        className={styles.deleteBtn}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Edit Restaurant</h2>
                <button
                  onClick={handleCloseEditModal}
                  className={styles.closeBtn}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className={styles.modalForm}>
                <input
                  type="text"
                  placeholder="Restaurant name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className={styles.input}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={styles.textarea}
                />

                <div className={styles.emojiSection}>
                  <label className={styles.emojiLabel}>🎯 Pick a Food Emoji:</label>
                  <div className={styles.emojiGrid}>
                    {FOOD_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`${styles.emojiButton} ${editEmoji === emoji ? styles.emojiSelected : ''}`}
                        onClick={() => setEditEmoji(emoji)}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <p className={styles.uploadHint}>
                  🎨 Pick an emoji to represent this restaurant
                </p>

                <div className={styles.modalButtonGroup}>
                  <button
                    type="submit"
                    disabled={locationsLoading}
                    className={styles.submitBtn}
                  >
                    {locationsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
