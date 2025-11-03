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

  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [userVotedLocationId, setUserVotedLocationId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [fetchingLogo, setFetchingLogo] = useState(false);

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

  const fetchLogoFromAPI = async (restaurantName) => {
    try {
      setFetchingLogo(true);
      const res = await fetch(`/api/logo?name=${encodeURIComponent(restaurantName)}`);

      if (!res.ok) {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to fetch logo', 'Logo Fetch Error');
        return null;
      }

      const data = await res.json();
      if (data.success) {
        return data.data.image;
      }
      return null;
    } catch (error) {
      console.error('Error fetching logo:', error);
      showError('Error fetching logo: ' + error.message, 'Error');
      return null;
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      let logoUrl = null;

      // Fetch logo from API Ninjas if restaurant name is provided
      if (newLocation.trim()) {
        logoUrl = await fetchLogoFromAPI(newLocation.trim());
      }

      const res = await fetch('/api/lunch-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newLocation, description, logoUrl }),
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
        const hasVotedOnThis = updatedLocation.voters?.some((voter) => voter._id === user?._id);
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

  const handleOpenEditModal = (location) => {
    setEditingId(location._id);
    setEditName(location.name);
    setEditDescription(location.description || '');
  };

  const handleCloseEditModal = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      // Fetch logo if name changed
      let logoUrl = null;
      const location = locations.find((loc) => loc._id === editingId);

      if (editName !== location?.name) {
        logoUrl = await fetchLogoFromAPI(editName.trim());
      } else {
        logoUrl = location?.logoUrl || null;
      }

      const res = await fetch(`/api/lunch-locations/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, description: editDescription, logoUrl }),
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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/lunch/edit" className={styles.backBtn}>
              🔧 Manage Restaurants
            </Link>
            <Link href="/" className={styles.backBtn}>
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>🍽️ Add a New Restaurant</h2>
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

            <p className={styles.uploadHint}>
              🔍 Logo will be automatically fetched from the restaurant name
            </p>

            <button
              type="submit"
              disabled={locationsLoading || fetchingLogo}
              className={styles.submitBtn}
            >
              {locationsLoading || fetchingLogo ? 'Adding...' : 'Add Restaurant'}
            </button>
          </form>
        </div>

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
                      {location.logoUrl && (
                        <div className={styles.restaurantLogo}>
                          <img src={location.logoUrl} alt={location.name} />
                        </div>
                      )}
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
                          <>
                            <button
                              onClick={() => handleOpenEditModal(location)}
                              className={styles.editBtn}
                              title="Edit restaurant"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location._id)}
                              className={styles.deleteBtn}
                            >
                              Delete
                            </button>
                          </>
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

                <p className={styles.uploadHint}>
                  🔍 Logo will be automatically updated when restaurant name changes
                </p>

                <div className={styles.modalButtonGroup}>
                  <button
                    type="submit"
                    disabled={locationsLoading || fetchingLogo}
                    className={styles.submitBtn}
                  >
                    {locationsLoading || fetchingLogo ? 'Saving...' : 'Save Changes'}
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
