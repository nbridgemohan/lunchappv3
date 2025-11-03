'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './lunch.module.css';

export default function LunchPage() {
  const { user, token, loading, sessionExpired } = useAuth();
  const router = useRouter();

  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [userVotedLocationId, setUserVotedLocationId] = useState(null);

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
      fetchLocations();
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
          loc.voters?.some((voter) => voter._id === user?._id)
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
        body: JSON.stringify({ name: newLocation, description }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations([data.data, ...locations]);
        setNewLocation('');
        setDescription('');
        showMessage('Restaurant added successfully!', 'success');
      } else {
        showMessage('Error adding location: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      showMessage('Error: ' + error.message, 'error');
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
        showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        const updatedLocation = data.data;
        setLocations(locations.map((loc) => (loc._id === locationId ? updatedLocation : loc)));

        // Update user's vote tracking
        const hasVotedOnThis = updatedLocation.voters?.some((voter) => voter._id === user?._id);
        setUserVotedLocationId(hasVotedOnThis ? locationId : null);

        showMessage(data.message, 'success');
      } else {
        showMessage('Error voting: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error voting:', error);
      showMessage('Error: ' + error.message, 'error');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

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
        showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLocations(locations.filter((loc) => loc._id !== locationId));
        showMessage('Restaurant deleted successfully!', 'success');
      } else {
        showMessage('Error deleting location: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      showMessage('Error: ' + error.message, 'error');
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
            Back to Items
          </Link>
        </div>

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
          <button
            type="submit"
            disabled={locationsLoading}
            className={styles.submitBtn}
          >
            {locationsLoading ? 'Adding...' : 'Add Restaurant'}
          </button>
        </form>

        <div className={styles.votingSection}>
          <h2>Vote for your lunch spot</h2>
          {locations.length === 0 ? (
            <p className={styles.empty}>No restaurants yet. Add one above!</p>
          ) : (
            <div className={styles.locationsList}>
              {locations
                .sort((a, b) => b.votes - a.votes)
                .map((location) => {
                  const hasVoted = location.voters?.some((voter) => voter._id === user?._id);
                  const canVote = !userVotedLocationId || userVotedLocationId === location._id;
                  return (
                    <div key={location._id} className={styles.locationCard}>
                      <div className={styles.locationInfo}>
                        <div className={styles.locationHeader}>
                          <h3>{location.name}</h3>
                          <span className={styles.votes}>{location.votes} votes</span>
                        </div>
                        {location.description && (
                          <p className={styles.description}>{location.description}</p>
                        )}
                        <p className={styles.createdBy}>
                          Added by {location.createdBy.username}
                        </p>
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
                        {location.createdBy._id === user?._id && (
                          <button
                            onClick={() => handleDeleteLocation(location._id)}
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        )}
                        <Link
                          href={`/lunch/${location._id}/orders`}
                          className={styles.ordersBtn}
                        >
                          Orders
                        </Link>
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
