import { useState, useCallback } from 'react';
import { useAI } from './useAI';
import { saveCard } from '../utils/storage';

export function useHenja() {
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [labels, setLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [specimenName, setSpecimenName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedCard, setSavedCard] = useState(null);

  const { generateLabels, generateSpecimenName } = useAI();

  const submitInput = useCallback(async (text) => {
    setInputText(text);
    setIsLoading(true);
    try {
      const result = await generateLabels(text);
      setLabels(result);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  }, [generateLabels]);

  const toggleLabel = useCallback((label) => {
    setSelectedLabels((prev) => {
      if (prev.includes(label)) {
        return prev.filter((l) => l !== label);
      }
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  }, []);

  const submitLabels = useCallback(async () => {
    setIsLoading(true);
    setStep(3);
    try {
      const name = await generateSpecimenName(inputText, selectedLabels);
      setSpecimenName(name);
    } finally {
      setIsLoading(false);
    }
  }, [generateSpecimenName, inputText, selectedLabels]);

  const advanceToSpecimen = useCallback(() => {
    setStep(4);
  }, []);

  const saveSpecimen = useCallback(() => {
    const card = saveCard({
      specimenName,
      inputText,
      labels: selectedLabels,
    });
    setSavedCard(card);
    setStep(5);
  }, [specimenName, inputText, selectedLabels]);

  const reset = useCallback(() => {
    setStep(1);
    setInputText('');
    setLabels([]);
    setSelectedLabels([]);
    setSpecimenName('');
    setSavedCard(null);
  }, []);

  return {
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
  };
}
