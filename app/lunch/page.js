'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './lunch.module.css';
import { showError, showSuccess, showConfirm } from '@/lib/errorHandler';

export default function LunchPage() {
  const { user, token, loading, sessionExpired } = useAuth();
  const router = useRouter();

  const FOOD_EMOJIS = ['🍕', '🍔', '🍟', '🌮', '🌯', '🥗', '🍜', '🍱', '🍛', '🍝', '🍲', '🥘', '🍣', '🍤', '🍗', '🌭', '🥪', '🍖', '🌶️', '🥠', '🍚', '🥟'];

  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [userVotedLocationId, setUserVotedLocationId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterText, setFilterText] = useState('');

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

  const showMessage = (msg, type) => {
    // Keep this for non-error messages (like toast notifications)
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/lunch-locations');

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`Failed to fetch locations: HTTP ${res.status}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations(data.data);

        // Find which location the user voted for
        const userVote = data.data.find((loc) =>
          loc.voters?.some((voter) => voter._id === user?.userId)
        );
        setUserVotedLocationId(userVote?._id || null);
      } else {
        showMessage('Failed to fetch locations: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showMessage('Error fetching locations: ' + error.message, 'error');
    }
  };


  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      const res = await fetch('/api/lunch-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newLocation, description, emoji: selectedEmoji }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Failed to Add Restaurant');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations([data.data, ...locations]);
        setNewLocation('');
        setDescription('');
        setSelectedEmoji('🍽️');
        showSuccess('Restaurant added successfully!');
      } else {
        showError(data.error || 'Unknown error', 'Failed to Add Restaurant');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      showError(error.message, 'Error');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleVote = async (locationId) => {
    try {
      const res = await fetch(`/api/lunch-locations/${locationId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showError(`HTTP Error ${res.status}: ${text || res.statusText}`, 'Voting Failed');
        return;
      }

      const data = await res.json();
      if (data.success) {
        const updatedLocation = data.data;
        setLocations(locations.map((loc) => (loc._id === locationId ? updatedLocation : loc)));

        // Update user's vote tracking
        const hasVotedOnThis = updatedLocation.voters?.some((voter) => voter._id === user?.userId);
        setUserVotedLocationId(hasVotedOnThis ? locationId : null);

        showSuccess(data.message);
      } else {
        showError(data.error || 'Unknown error', 'Voting Failed');
      }
    } catch (error) {
      console.error('Error voting:', error);
      showError(error.message, 'Error');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    const confirmed = await showConfirm(
      'Delete Restaurant?',
      'Are you sure you want to delete this restaurant? This action cannot be undone.',
      'Yes, Delete'
    );
    if (!confirmed) return;

    try {
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
    }
  };


  if (loading) {
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
            <h1>Lunch Voting</h1>
            <p>Vote on where to go for lunch today!</p>
          </div>
          <Link href="/" className={styles.backBtn}>
            Back to Dashboard
          </Link>
        </div>

        <div className={styles.formSection}>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={styles.formToggle}
          >
            <span className={styles.toggleIcon}>{showAddForm ? '▼' : '▶'}</span>
            <span>🍽️ Add a New Restaurant</span>
          </button>
          {showAddForm && (
          <form onSubmit={handleAddLocation} className={styles.form}>
            <input
              type="text"
              placeholder="Restaurant name"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              required
              className={styles.input}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />

            <div className={styles.emojiSection}>
              <label className={styles.emojiLabel}>🎯 Pick a Food Emoji:</label>
              <div className={styles.emojiGrid}>
                {FOOD_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`${styles.emojiButton} ${selectedEmoji === emoji ? styles.emojiSelected : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
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

            <button
              type="submit"
              disabled={locationsLoading}
              className={styles.submitBtn}
            >
              {locationsLoading ? 'Adding...' : 'Add Restaurant'}
            </button>
          </form>
          )}
        </div>

        <div className={styles.votingSection}>
          <h2>Vote for your lunch spot</h2>
          {locations.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="🔍 Search restaurants..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className={styles.input}
                style={{
                  marginBottom: 0,
                }}
              />
            </div>
          )}
          {locations.length === 0 ? (
            <p className={styles.empty}>No restaurants yet. Add one above!</p>
          ) : (
            <div className={styles.locationsList}>
              {locations
                .filter((location) => location.name.toLowerCase().includes(filterText.toLowerCase()))
                .sort((a, b) => b.votes - a.votes)
                .map((location) => {
                  const hasVoted = location.voters?.some((voter) => voter._id === user?.userId);
                  const canVote = !userVotedLocationId || userVotedLocationId === location._id;
                  return (
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
                        {location.createdBy && (
                          <p className={styles.createdBy}>
                            Added by {location.createdBy.username}
                          </p>
                        )}
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleVote(location._id)}
                          disabled={!canVote && !hasVoted}
                          className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''} ${!canVote && !hasVoted ? styles.disabled : ''}`}
                          title={!canVote && !hasVoted ? 'Unvote from your current choice first' : ''}
                        >
                          {hasVoted ? '✓ Voted' : 'Vote'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
