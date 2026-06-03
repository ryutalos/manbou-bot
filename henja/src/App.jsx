import { useState } from 'react';
import { useHenja } from './hooks/useHenja';
import Step1Input from './components/Step1Input';
import Step2Labels from './components/Step2Labels';
import Step3Evolution from './components/Step3Evolution';
import Step4Specimen from './components/Step4Specimen';
import Step5Card from './components/Step5Card';
import Zukan from './components/Zukan';
import './App.css';

const headerStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '16px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: 100,
  background: 'var(--bg)',
  borderBottom: '1px solid var(--ink-faint)',
};

const logoStyles = {
  fontFamily: "'Noto Serif JP', serif",
  fontWeight: 300,
  fontSize: '1rem',
  color: 'var(--ink)',
  letterSpacing: '0.16em',
  cursor: 'pointer',
};

const zukanBtnStyles = {
  padding: '7px 20px',
  background: 'transparent',
  border: '1px solid var(--ink-faint)',
  borderRadius: '2px',
  fontFamily: "'Noto Sans JP', sans-serif",
  fontSize: '0.75rem',
  color: 'var(--ink-mid)',
  cursor: 'pointer',
  letterSpacing: '0.08em',
  transition: 'border-color 0.18s, color 0.18s',
};

export default function App() {
  const [showZukan, setShowZukan] = useState(false);
  const {
    step,
    inputText,
    labels,
    selectedLabels,
    specimenName,
    isLoading,
    savedCard,
    submitInput,
    toggleLabel,
    submitLabels,
    advanceToSpecimen,
    saveSpecimen,
    reset,
  } = useHenja();

  function handleLogoClick() {
    setShowZukan(false);
    reset();
  }

  function handleZukanOpen() {
    setShowZukan(true);
  }

  function handleNewCollection() {
    setShowZukan(false);
    reset();
  }

  return (
    <>
      <header style={headerStyles}>
        <span style={logoStyles} onClick={handleLogoClick}>
          HENJA
        </span>
        {!showZukan && (
          <button
            style={zukanBtnStyles}
            onClick={handleZukanOpen}
          >
            図鑑を見る
          </button>
        )}
      </header>

      <div style={{ paddingTop: '52px' }}>
        {showZukan ? (
          <Zukan onNew={handleNewCollection} />
        ) : (
          <>
            {step === 1 && (
              <Step1Input onSubmit={submitInput} isLoading={isLoading} />
            )}
            {step === 2 && (
              <Step2Labels
                labels={labels}
                selectedLabels={selectedLabels}
                onToggle={toggleLabel}
                onNext={submitLabels}
                isLoading={isLoading}
              />
            )}
            {step === 3 && (
              <Step3Evolution
                selectedLabels={selectedLabels}
                specimenName={specimenName}
                isLoading={isLoading}
                onAdvance={advanceToSpecimen}
              />
            )}
            {step === 4 && (
              <Step4Specimen
                specimenName={specimenName}
                inputText={inputText}
                selectedLabels={selectedLabels}
                onSave={saveSpecimen}
              />
            )}
            {step === 5 && (
              <Step5Card
                savedCard={savedCard}
                onReset={reset}
                onZukan={handleZukanOpen}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
