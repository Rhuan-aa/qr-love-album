import { createServerFn } from "@tanstack/react-start";
import { v4 as uuid } from "uuid";
import { createClient } from "@libsql/client";

export type Card = {
  id: string;
  title: string;
  imageUrl: string;
  letter: string;
  createdAt: number;
  unlockedAt: number | null;
};

const ADMIN_KEY = "love-album:admin";
export const ADMIN_PASSWORD = "meu-amor-2026";

// Turso Database Client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

// Server Functions
export const listCards = createServerFn({ method: "GET" })
  .handler(async () => {
    const { rows } = await db.execute("SELECT * FROM cards ORDER BY createdAt ASC");
    // Ensure we return a plain array of objects for proper serialization
    return JSON.parse(JSON.stringify(rows)) as Card[];
  });

export const getCard = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { rows } = await db.execute({
      sql: "SELECT * FROM cards WHERE id = ?",
      args: [id],
    });
    const card = rows[0];
    return card ? (JSON.parse(JSON.stringify(card)) as Card) : null;
  });

export const createCard = createServerFn({ method: "POST" })
  .inputValidator((input: { title: string; imageUrl: string; letter: string }) => input)
  .handler(async ({ data: input }) => {
    // Use slugified title as ID instead of UUID
    let id = slugify(input.title);
    
    // Check if ID already exists to avoid collisions
    const existing = await db.execute({
      sql: "SELECT id FROM cards WHERE id = ?",
      args: [id],
    });
    
    if (existing.rows.length > 0) {
      // If exists, append a short random string
      id = `${id}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const card: Card = {
      id,
      title: input.title,
      imageUrl: input.imageUrl,
      letter: input.letter,
      createdAt: Date.now(),
      unlockedAt: null,
    };

    await db.execute({
      sql: "INSERT INTO cards (id, title, imageUrl, letter, createdAt, unlockedAt) VALUES (?, ?, ?, ?, ?, ?)",
      args: [card.id, card.title, card.imageUrl, card.letter, card.createdAt, card.unlockedAt],
    });

    return card;
  });

export const updateCard = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; patch: Partial<Pick<Card, "title" | "imageUrl" | "letter">> }) => input,
  )
  .handler(async ({ data: { id, patch } }) => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.title !== undefined) {
      fields.push("title = ?");
      values.push(patch.title);
    }
    if (patch.imageUrl !== undefined) {
      fields.push("imageUrl = ?");
      values.push(patch.imageUrl);
    }
    if (patch.letter !== undefined) {
      fields.push("letter = ?");
      values.push(patch.letter);
    }

    if (fields.length === 0) return;

    values.push(id);
    await db.execute({
      sql: `UPDATE cards SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });
  });

export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.execute({
      sql: "DELETE FROM cards WHERE id = ?",
      args: [id],
    });
  });

export const unlockCard = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { rows } = await db.execute({
      sql: "SELECT * FROM cards WHERE id = ?",
      args: [id],
    });
    const card = (rows[0] as unknown as Card) || null;
    if (!card) return null;

    const wasNew = card.unlockedAt === null;
    if (wasNew) {
      const now = Date.now();
      await db.execute({
        sql: "UPDATE cards SET unlockedAt = ? WHERE id = ?",
        args: [now, id],
      });
      card.unlockedAt = now;
    }

    return { card, wasNew };
  });

// Admin Auth (Keeping simple client-side for now, as it was before)
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
  // Capture anything after /unlock/ until a separator or end of string
  const m = text.match(/unlock\/([^?#/]+)/i);
  if (m) return m[1];
  
  // If it's just a raw slug (no slashes)
  const trimmed = text.trim();
  if (trimmed && !trimmed.includes("/")) return trimmed;
  
  return null;
}
