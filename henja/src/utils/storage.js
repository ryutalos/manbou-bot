const STORAGE_KEY = 'henja_cards';

export function getCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCard(card) {
  const cards = getCards();
  const newCard = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...card,
  };
  cards.unshift(newCard);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return newCard;
}

export function deleteCard(id) {
  const cards = getCards().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}
