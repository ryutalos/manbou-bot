import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    cursor: 'pointer',
  },
  labelsArea: {
    position: 'relative',
    width: '320px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '48px',
  },
  labelPill: {
    position: 'absolute',
    padding: '8px 16px',
    border: '1px solid var(--ink-faint)',
    borderRadius: '2px',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: '0.82rem',
    color: 'var(--ink)',
    background: 'var(--bg)',
    whiteSpace: 'nowrap',
  },
  specimenName: {
    fontFamily: "'Noto Serif JP', serif",
    fontWeight: 300,
    fontSize: '1.6rem',
    color: 'var(--ink)',
    letterSpacing: '0.06em',
    textAlign: 'center',
    maxWidth: '480px',
  },
  hint: {
    marginTop: '48px',
    fontSize: '0.72rem',
    color: 'var(--ink-mid)',
    letterSpacing: '0.1em',
  },
};

const OFFSETS = [
  { x: -110, y: -30 },
  { x: 110, y: -30 },
  { x: -60, y: 30 },
  { x: 60, y: 30 },
  { x: 0, y: -50 },
  { x: 0, y: 50 },
];

export default function Step3Evolution({ selectedLabels, specimenName, isLoading, onAdvance }) {
  const [phase, setPhase] = useState('spread'); // spread → gather → name

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('gather'), 600);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase === 'gather' && !isLoading && specimenName) {
      const t2 = setTimeout(() => setPhase('name'), 900);
      return () => clearTimeout(t2);
    }
  }, [phase, isLoading, specimenName]);

  useEffect(() => {
    if (phase === 'name') {
      const t3 = setTimeout(() => onAdvance(), 2800);
      return () => clearTimeout(t3);
    }
  }, [phase, onAdvance]);

  const gathered = phase === 'gather' || phase === 'name';

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onClick={phase === 'name' ? onAdvance : undefined}
    >
      <div style={styles.labelsArea}>
        {selectedLabels.map((label, i) => {
          const off = OFFSETS[i % OFFSETS.length];
          return (
            <motion.span
              key={label}
              style={styles.labelPill}
              animate={{
                x: gathered ? 0 : off.x,
                y: gathered ? 0 : off.y,
                opacity: phase === 'name' ? 0 : 1,
                scale: gathered ? 0.92 : 1,
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {label}
            </motion.span>
          );
        })}

        {/* glow */}
        <AnimatePresence>
          {phase === 'gather' && (
            <motion.div
              key="glow"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(196,145,90,0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'name' && specimenName && (
          <motion.p
            key="name"
            style={styles.specimenName}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {specimenName}
          </motion.p>
        )}
      </AnimatePresence>

      {phase !== 'name' && (
        <motion.p
          style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', letterSpacing: '0.1em' }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          標本を形成中…
        </motion.p>
      )}

      {phase === 'name' && (
        <motion.p
          style={styles.hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          タップして続ける
        </motion.p>
      )}
    </motion.div>
  );
}
