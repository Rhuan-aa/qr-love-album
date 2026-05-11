import { v4 as uuid } from "uuid";

export type Card = {
  id: string;
  title: string;
  imageUrl: string;
  letter: string;
  createdAt: number;
  unlockedAt: number | null;
};

const CARDS_KEY = "love-album:cards";
const ADMIN_KEY = "love-album:admin";

// Default admin password (change here or via env). For a real-world deployment
// move this to a server-side check. This is a personal gift app — keep simple.
export const ADMIN_PASSWORD = "meu-amor-2026";

function read(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Card[];
  } catch {
    return [];
  }
}

function write(cards: Card[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event("love-album:update"));
}

export const cardsStore = {
  list(): Card[] {
    return read().sort((a, b) => a.createdAt - b.createdAt);
  },
  unlocked(): Card[] {
    return read().filter((c) => c.unlockedAt !== null);
  },
  get(id: string): Card | undefined {
    return read().find((c) => c.id === id);
  },
  create(input: { title: string; imageUrl: string; letter: string }): Card {
    const card: Card = {
      id: uuid(),
      title: input.title,
      imageUrl: input.imageUrl,
      letter: input.letter,
      createdAt: Date.now(),
      unlockedAt: null,
    };
    write([...read(), card]);
    return card;
  },
  unlock(id: string): { card: Card; wasNew: boolean } | null {
    const cards = read();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const wasNew = cards[idx].unlockedAt === null;
    if (wasNew) {
      cards[idx] = { ...cards[idx], unlockedAt: Date.now() };
      write(cards);
    }
    return { card: cards[idx], wasNew };
  },
  update(id: string, patch: Partial<Pick<Card, "title" | "imageUrl" | "letter">>) {
    const cards = read();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return;
    cards[idx] = { ...cards[idx], ...patch };
    write(cards);
  },
  remove(id: string) {
    write(read().filter((c) => c.id !== id));
  },
};

export const adminAuth = {
  isAuthed(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(ADMIN_KEY) === "1";
  },
  login(password: string): boolean {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_KEY, "1");
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem(ADMIN_KEY);
  },
};

export function extractCardId(text: string): string | null {
  // Accept full URL ".../unlock/<id>" or raw id
  const m = text.match(/unlock\/([0-9a-f-]{8,})/i);
  if (m) return m[1];
  if (/^[0-9a-f-]{8,}$/i.test(text.trim())) return text.trim();
  return null;
}
