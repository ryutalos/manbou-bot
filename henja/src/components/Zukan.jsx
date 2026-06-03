import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getCards } from '../utils/storage';

const styles = {
  wrapper: {
    minHeight: '100vh',
    padding: '56px 24px 80px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '48px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.6rem',
    color: 'var(--ink)',
    letterSpacing: '0.08em',
  },
  count: {
    fontSize: '0.72rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.1em',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  newBtn: {
    padding: '10px 28px',
    background: 'transparent',
    border: '1px solid var(--ink)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.8rem',
    color: 'var(--ink)',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'background 0.18s, color 0.18s',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'white',
    border: '1px solid var(--ink-faint)',
    borderRadius: '4px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardDate: {
    fontSize: '0.62rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.12em',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  cardName: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.05rem',
    color: 'var(--ink)',
    letterSpacing: '0.04em',
    lineHeight: '1.6',
  },
  labelsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  labelTag: {
    padding: '3px 8px',
    border: '1px solid var(--ink-faint)',
    borderRadius: '2px',
    fontSize: '0.68rem',
    color: 'var(--ink-mid)',
    fontFamily: "'Noto Sans JP', sans-serif",
    letterSpacing: '0.03em',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    gap: '12px',
  },
  emptyText: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.1rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.06em',
  },
  emptySub: {
    fontSize: '0.75rem',
    color: 'var(--ink-faint)',
    letterSpacing: '0.08em',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Zukan({ onNew }) {
  const [cards, setCards] = useState([]);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setCards(getCards());
  }, []);

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div style={styles.header}>
        <div>
          <p style={styles.title}>不思議の図鑑</p>
          {cards.length > 0 && (
            <p style={styles.count}>{cards.length}点の標本</p>
          )}
        </div>
        <button
          style={{
            ...styles.newBtn,
            ...(hover ? { background: 'var(--ink)', color: 'var(--bg)' } : {}),
          }}
          onClick={onNew}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          新しく採集する
        </button>
      </div>

      {cards.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>まだ標本がありません</p>
          <p style={styles.emptySub}>日常の不思議を採集してみましょう</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              style={styles.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <p style={styles.cardDate}>{formatDate(card.createdAt)}</p>
              <p style={styles.cardName}>{card.specimenName}</p>
              {card.labels?.length > 0 && (
                <div style={styles.labelsRow}>
                  {card.labels.map((l) => (
                    <span key={l} style={styles.labelTag}>{l}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
