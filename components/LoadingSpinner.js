'use client';

import { useState, useEffect } from 'react';
import styles from './LoadingSpinner.module.css';

const FOOD_EMOJIS = [
  // Fast food & burgers
  '🍕', '🍔', '🍟', '🌭','🍗'
  // Chicken & meat
  // , '🥓', '🍖', '🥩',
  // Rice & noodles
  // '🍜', '🍝', '🍲', '🍛', '🍱', '🍙', '🍚', '🥘', '🥫',
  // Asian food
  // '🍣', '🥟', '🍤', '🥠', '🍢', '🥮',
  // Salads & vegetables
  // '🥗', '🫕', '🧆',
  // Bread & sandwiches
  // '🥐', '🥖', '🫓', '🥨', '🥯',
  // Breakfast/Brunch
  // '🍳', '🥞', '🧇',
  // Sides
  // '🍘', '🍥',
  // General meal icons
  // '🍴', '🍽️', '🥢', '🥡', '🥣'
];

export default function LoadingSpinner({ message = 'Loading...' }) {
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    // Select a random food emoji when component mounts
    const randomEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
    setEmoji(randomEmoji);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.emojiSpinner}>{emoji}</div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
