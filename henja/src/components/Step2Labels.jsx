import { motion } from 'framer-motion';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  heading: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.3rem',
    color: 'var(--ink)',
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '0.04em',
  },
  sub: {
    fontSize: '0.78rem',
    color: 'var(--ink-mid)',
    marginBottom: '40px',
    textAlign: 'center',
    letterSpacing: '0.06em',
  },
  tagsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    maxWidth: '560px',
    marginBottom: '40px',
  },
  tag: (selected) => ({
    padding: '9px 18px',
    border: `1px solid ${selected ? 'var(--ink)' : 'var(--ink-faint)'}`,
    borderRadius: '2px',
    background: selected ? 'var(--ink)' : 'transparent',
    color: selected ? 'var(--bg)' : 'var(--ink)',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.18s',
    letterSpacing: '0.04em',
  }),
  button: {
    padding: '12px 40px',
    background: 'transparent',
    border: '1px solid var(--ink)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.85rem',
    color: 'var(--ink)',
    cursor: 'pointer',
    letterSpacing: '0.1em',
  },
  buttonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  count: {
    fontSize: '0.75rem',
    color: 'var(--ink-mid)',
    marginBottom: '20px',
    letterSpacing: '0.06em',
  },
};

export default function Step2Labels({ labels, selectedLabels, onToggle, onNext, isLoading }) {
  const canNext = selectedLabels.length >= 1 && !isLoading;

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <p style={styles.heading}>観察ラベルを選んでください</p>
      <p style={styles.sub}>この不思議に近いものを 2〜3個</p>

      <div style={styles.tagsGrid}>
        {labels.map((label, i) => (
          <motion.button
            key={label}
            style={styles.tag(selectedLabels.includes(label))}
            onClick={() => onToggle(label)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      <p style={styles.count}>
        {selectedLabels.length === 0
          ? '選択なし'
          : `${selectedLabels.length}個選択中`}
        　（最大3個）
      </p>

      {isLoading ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', letterSpacing: '0.08em' }}>標本名を考えています…</p>
      ) : (
        <button
          style={{
            ...styles.button,
            ...(!canNext ? styles.buttonDisabled : {}),
          }}
          disabled={!canNext}
          onClick={onNext}
        >
          標本を作る
        </button>
      )}
    </motion.div>
  );
}
