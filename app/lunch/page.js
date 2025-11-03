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
  const [logoImage, setLogoImage] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [userVotedLocationId, setUserVotedLocationId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLogoImage, setEditLogoImage] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);

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

  const handleImageUpload = async (file) => {
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file', 'Invalid File Type');
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Image size must be less than 5MB', 'File Too Large');
      return null;
    }

    // Create FormData for backend upload endpoint
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        showError(errorData.error || 'Failed to upload image', 'Upload Error');
        return null;
      }

      const data = await res.json();
      return data.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      showError('Error uploading image: ' + error.message, 'Upload Error');
      return null;
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file', 'Invalid File Type');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Image size must be less than 5MB', 'File Too Large');
      return;
    }

    setLogoImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      let logoUrl = null;

      // Upload image if selected
      if (logoImage) {
        logoUrl = await handleImageUpload(logoImage);
        if (!logoUrl) {
          setLocationsLoading(false);
          return;
        }
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
        setLogoImage(null);
        setLogoPreview(null);
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

  const handleEditLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file', 'Invalid File Type');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Image size must be less than 5MB', 'File Too Large');
      return;
    }

    setEditLogoImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditModal = (location) => {
    setEditingId(location._id);
    setEditName(location.name);
    setEditDescription(location.description || '');
    setEditLogoPreview(location.logoUrl || null);
    setEditLogoImage(null);
  };

  const handleCloseEditModal = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditLogoImage(null);
    setEditLogoPreview(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLocationsLoading(true);

    try {
      let logoUrl = editLogoPreview;

      // Upload new image if selected
      if (editLogoImage) {
        logoUrl = await handleImageUpload(editLogoImage);
        if (!logoUrl) {
          setLocationsLoading(false);
          return;
        }
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
          <Link href="/" className={styles.backBtn}>
            Back to Items
          </Link>
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

            <div className={styles.logoUploadSection}>
              <label htmlFor="logo-upload" className={styles.uploadLabel}>
                📸 Restaurant Logo (optional)
              </label>
              <div className={styles.uploadContainer}>
                {logoPreview && (
                  <div className={styles.logoPreview}>
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className={styles.fileInput}
                  disabled={locationsLoading}
                />
                <label htmlFor="logo-upload" className={styles.uploadButton}>
                  {logoImage ? '✓ Image Selected' : 'Choose Image'}
                </label>
                <p className={styles.uploadHint}>Max 5MB • PNG, JPG, GIF</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={locationsLoading}
              className={styles.submitBtn}
            >
              {locationsLoading ? 'Adding...' : 'Add Restaurant'}
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

                <div className={styles.logoUploadSection}>
                  <label htmlFor="edit-logo-upload" className={styles.uploadLabel}>
                    📸 Restaurant Logo
                  </label>
                  <div className={styles.uploadContainer}>
                    {editLogoPreview && (
                      <div className={styles.logoPreview}>
                        <img src={editLogoPreview} alt="Logo preview" />
                      </div>
                    )}
                    <input
                      id="edit-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleEditLogoSelect}
                      className={styles.fileInput}
                      disabled={locationsLoading}
                    />
                    <label htmlFor="edit-logo-upload" className={styles.uploadButton}>
                      {editLogoImage ? '✓ New Image Selected' : 'Choose Image'}
                    </label>
                    <p className={styles.uploadHint}>Max 5MB • PNG, JPG, GIF</p>
                  </div>
                </div>

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
