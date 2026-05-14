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
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.error("TURSO_DATABASE_URL is not defined in environment variables");
}

const db = createClient({
  url: dbUrl || "file:local.db",
  authToken: dbToken,
});

// Server Functions
export const listCards = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { rows } = await db.execute("SELECT * FROM cards ORDER BY createdAt ASC");
      return rows as unknown as Card[];
    } catch (error) {
      console.error("Error in listCards:", error);
      throw error;
    }
  });

export const getCard = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    try {
      const { rows } = await db.execute({
        sql: "SELECT * FROM cards WHERE id = ?",
        args: [id],
      });
      return (rows[0] as unknown as Card) || null;
    } catch (error) {
      console.error("Error in getCard:", error);
      throw error;
    }
  });

export const createCard = createServerFn({ method: "POST" })
  .inputValidator((input: { title: string; imageUrl: string; letter: string }) => input)
  .handler(async ({ data: input }) => {
    try {
      const card: Card = {
        id: uuid(),
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
    } catch (error) {
      console.error("Error in createCard:", error);
      throw error;
    }
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
  const m = text.match(/unlock\/([0-9a-f-]{8,})/i);
  if (m) return m[1];
  if (/^[0-9a-f-]{8,}$/i.test(text.trim())) return text.trim();
  return null;
}
