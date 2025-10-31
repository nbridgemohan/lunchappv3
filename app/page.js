'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const APP_VERSION = '1.0.0';

export default function Home() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    fetchItems();
  }, []);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.success) {
        showMessage('MongoDB connection OK!', 'success');
      } else {
        showMessage('MongoDB error: ' + (data.error || 'Unknown'), 'error');
      }
    } catch (error) {
      showMessage('Health check failed: ' + error.message, 'error');
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`Failed to fetch items: HTTP ${res.status}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        console.error('API error:', data.error);
        showMessage('Failed to fetch items: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      showMessage('Error fetching items: ' + error.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/items/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('API error response:', text);
          showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setItems(items.map((item) => (item._id === editingId ? data.data : item)));
          setEditingId(null);
          showMessage('Item updated successfully!', 'success');
        } else {
          showMessage('Error updating item: ' + (data.error || 'Unknown error'), 'error');
        }
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('API error response:', text);
          showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
          return;
        }

        const data = await res.json();
        if (data.success) {
          setItems([data.data, ...items]);
          showMessage('Item added successfully!', 'success');
        } else {
          showMessage('Error adding item: ' + (data.error || 'Unknown error'), 'error');
        }
      }
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting form:', error);
      showMessage('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setItems(items.filter((item) => item._id !== id));
        showMessage('Item deleted successfully!', 'success');
      } else {
        showMessage('Error deleting item: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showMessage('Error: ' + error.message, 'error');
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setDescription(item.description);
    setEditingId(item._id);
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setEditingId(null);
  };

  const toggleComplete = async (item) => {
    try {
      const res = await fetch(`/api/items/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, completed: !item.completed }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        showMessage(`HTTP Error ${res.status}: ${text || res.statusText}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setItems(items.map((i) => (i._id === item._id ? data.data : i)));
      } else {
        showMessage('Error updating item: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showMessage('Error: ' + error.message, 'error');
    }
  };

  return (
    <main className={styles.main}>
      {message && (
        <div className={`${styles.notification} ${styles[messageType]}`}>
          {message}
        </div>
      )}
      <div className={styles.container}>
        <h1>Lunch App</h1>
        <p>Organize your lunch preferences and dietary needs</p>

        <button onClick={checkHealth} className={styles.healthBtn}>
          Check DB Connection
        </button>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.input}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className={styles.textarea}
          />
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add Item'}
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

        <div className={styles.itemsList}>
          {items.length === 0 ? (
            <p className={styles.empty}>No items yet. Create one above!</p>
          ) : (
            items.map((item) => (
              <div
                key={item._id}
                className={`${styles.item} ${
                  item.completed ? styles.completed : ''
                }`}
              >
                <div className={styles.itemContent}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item)}
                    className={styles.checkbox}
                  />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editBtn}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.version}>v{APP_VERSION}</div>
      </div>
    </main>
  );
}
