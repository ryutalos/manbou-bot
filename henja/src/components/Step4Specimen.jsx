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
  card: {
    background: 'white',
    border: '1px solid var(--ink-faint)',
    borderRadius: '4px',
    padding: '40px 36px',
    maxWidth: '520px',
    width: '100%',
    position: 'relative',
  },
  cardNo: {
    position: 'absolute',
    top: '16px',
    right: '20px',
    fontSize: '0.65rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.12em',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  specimenLabel: {
    fontSize: '0.62rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.16em',
    fontFamily: "'Noto Sans JP', sans-serif",
    marginBottom: '12px',
    textTransform: 'uppercase',
  },
  specimenName: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.65rem',
    color: 'var(--ink)',
    letterSpacing: '0.05em',
    lineHeight: '1.5',
    marginBottom: '28px',
  },
  divider: {
    width: '100%',
    height: '1px',
    background: 'var(--ink-faint)',
    marginBottom: '24px',
  },
  inputSection: {
    marginBottom: '24px',
  },
  inputLabel: {
    fontSize: '0.62rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.12em',
    fontFamily: "'Noto Sans JP', sans-serif",
    marginBottom: '8px',
  },
  inputText: {
    fontSize: '0.85rem',
    color: 'var(--ink)',
    lineHeight: '1.8',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  labelsSection: {
    marginBottom: '0',
  },
  labelsLabel: {
    fontSize: '0.62rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.12em',
    fontFamily: "'Noto Sans JP', sans-serif",
    marginBottom: '10px',
  },
  labelsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  labelTag: {
    padding: '5px 12px',
    border: '1px solid var(--ink-faint)',
    borderRadius: '2px',
    fontSize: '0.75rem',
    color: 'var(--ink-mid)',
    fontFamily: "'Noto Sans JP', sans-serif",
    letterSpacing: '0.04em',
  },
  saveButton: {
    marginTop: '32px',
    padding: '13px 44px',
    background: 'var(--ink)',
    border: 'none',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.85rem',
    color: 'var(--bg)',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    transition: 'opacity 0.2s',
  },
};

export default function Step4Specimen({ specimenName, inputText, selectedLabels, onSave }) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <motion.div
        style={styles.card}
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span style={styles.cardNo}>標本 No.{Date.now().toString().slice(-4)}</span>

        <p style={styles.specimenLabel}>SPECIMEN NAME</p>
        <p style={styles.specimenName}>{specimenName}</p>

        <div style={styles.divider} />

        <div style={styles.inputSection}>
          <p style={styles.inputLabel}>観察記録</p>
          <p style={styles.inputText}>{inputText}</p>
        </div>

        <div style={styles.labelsSection}>
          <p style={styles.labelsLabel}>観察ラベル</p>
          <div style={styles.labelsRow}>
            {selectedLabels.map((l) => (
              <span key={l} style={styles.labelTag}>{l}</span>
            ))}
          </div>
        </div>
      </motion.div>

      <button
        style={{ ...styles.saveButton, opacity: hover ? 0.8 : 1 }}
        onClick={onSave}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        図鑑に保存する
      </button>
    </motion.div>
  );
}
