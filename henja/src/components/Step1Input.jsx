import { useState } from 'react';
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
  label: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.5rem',
    color: 'var(--ink)',
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '0.04em',
  },
  sublabel: {
    fontSize: '0.8rem',
    color: 'var(--ink-mid)',
    marginBottom: '32px',
    textAlign: 'center',
    letterSpacing: '0.06em',
  },
  textarea: {
    width: '100%',
    maxWidth: '520px',
    minHeight: '140px',
    padding: '20px',
    background: 'white',
    border: '1px solid var(--ink-faint)',
    borderRadius: '4px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.95rem',
    color: 'var(--ink)',
    lineHeight: '1.8',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    marginTop: '24px',
    padding: '12px 40px',
    background: 'transparent',
    border: '1px solid var(--ink)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.85rem',
    color: 'var(--ink)',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    transition: 'background 0.2s, color 0.2s',
  },
  buttonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  loadingText: {
    marginTop: '24px',
    fontSize: '0.8rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.08em',
  },
  divider: {
    width: '40px',
    height: '1px',
    background: 'var(--ink-faint)',
    margin: '0 auto 40px',
  },
};

export default function Step1Input({ onSubmit, isLoading }) {
  const [text, setText] = useState('');
  const [hover, setHover] = useState(false);

  const canSubmit = text.trim().length >= 5 && !isLoading;

  function handleSubmit(e) {
    e.preventDefault();
    if (canSubmit) onSubmit(text.trim());
  }

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <p style={styles.label}>最近、ちょっとした事件ありましたか？</p>
      <p style={styles.sublabel}>日常のなかで「よく考えると不思議」なこと</p>
      <div style={styles.divider} />

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <textarea
          style={{
            ...styles.textarea,
            borderColor: text ? 'var(--ink-mid)' : 'var(--ink-faint)',
          }}
          placeholder="例：スーパーのレジ袋をもらう時、いつも数を多めに言ってしまう。なんで？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />

        {isLoading ? (
          <p style={styles.loadingText}>観察中…</p>
        ) : (
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(canSubmit && hover ? { background: 'var(--ink)', color: 'var(--bg)' } : {}),
              ...(!canSubmit ? styles.buttonDisabled : {}),
            }}
            disabled={!canSubmit}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            採集する
          </button>
        )}
      </form>
    </motion.div>
  );
}
