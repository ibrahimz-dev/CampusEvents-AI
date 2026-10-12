import { getDatabase } from './init';

export interface Favorite {
  eventId: string;
  userId: string;
  createdAt: string;
}

export function getFavoritesByUser(userId: string): Favorite[] {
  const db = getDatabase();
  return db.getAllSync(
    'SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  ) as Favorite[];
}

export function isFavorite(eventId: string, userId: string): boolean {
  const db = getDatabase();
  const result = db.getFirstSync(
    'SELECT * FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  );
  return !!result;
}

export function addFavorite(eventId: string, userId: string): void {
  const db = getDatabase();
  const createdAt = new Date().toISOString();
  db.runSync(
    'INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)',
    [eventId, userId, createdAt]
  );
}

export function removeFavorite(eventId: string, userId: string): void {
  const db = getDatabase();
  db.runSync(
    'DELETE FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  );
}
