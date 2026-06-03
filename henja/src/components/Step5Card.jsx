import { motion } from 'framer-motion';
import { useState } from 'react';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  checkmark: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '1px solid var(--ink-faint)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    fontSize: '1.2rem',
    color: 'var(--accent)',
  },
  heading: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.2rem',
    color: 'var(--ink)',
    letterSpacing: '0.06em',
    marginBottom: '6px',
    textAlign: 'center',
  },
  sub: {
    fontSize: '0.78rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.08em',
    marginBottom: '40px',
    textAlign: 'center',
  },
  card: {
    background: 'white',
    border: '1px solid var(--ink-faint)',
    borderRadius: '4px',
    padding: '28px 28px',
    maxWidth: '400px',
    width: '100%',
    marginBottom: '36px',
  },
  cardSpecimenName: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.2rem',
    color: 'var(--ink)',
    letterSpacing: '0.05em',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  cardDate: {
    fontSize: '0.65rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.1em',
    marginBottom: '12px',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  labelsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  labelTag: {
    padding: '4px 10px',
    border: '1px solid var(--ink-faint)',
    borderRadius: '2px',
    fontSize: '0.72rem',
    color: 'var(--ink-mid)',
    fontFamily: "'Noto Sans JP', sans-serif",
    letterSpacing: '0.04em',
  },
  buttonsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    padding: '11px 32px',
    background: 'transparent',
    border: '1px solid var(--ink)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.82rem',
    color: 'var(--ink)',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'background 0.18s, color 0.18s',
  },
  btnSecondary: {
    padding: '11px 32px',
    background: 'transparent',
    border: '1px solid var(--ink-faint)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.82rem',
    color: 'var(--ink-mid)',
    cursor: 'pointer',
    letterSpacing: '0.08em',
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Step5Card({ savedCard, onReset, onZukan }) {
  const [hover1, setHover1] = useState(false);

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <motion.div
        style={styles.checkmark}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        ◎
      </motion.div>

      <p style={styles.heading}>図鑑に収録されました</p>
      <p style={styles.sub}>あなただけの標本が増えました</p>

      {savedCard && (
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p style={styles.cardDate}>{formatDate(savedCard.createdAt)}</p>
          <p style={styles.cardSpecimenName}>{savedCard.specimenName}</p>
          <div style={styles.labelsRow}>
            {savedCard.labels?.map((l) => (
              <span key={l} style={styles.labelTag}>{l}</span>
            ))}
          </div>
        </motion.div>
      )}

      <div style={styles.buttonsRow}>
        <button
          style={{
            ...styles.btnPrimary,
            ...(hover1 ? { background: 'var(--ink)', color: 'var(--bg)' } : {}),
          }}
          onClick={onReset}
          onMouseEnter={() => setHover1(true)}
          onMouseLeave={() => setHover1(false)}
        >
          もう一度採集する
        </button>
        <button style={styles.btnSecondary} onClick={onZukan}>
          図鑑を見る
        </button>
      </div>
    </motion.div>
  );
}
