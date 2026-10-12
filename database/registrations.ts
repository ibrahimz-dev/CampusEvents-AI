import { getDatabase } from './init';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
}

export function getRegistrationsByUser(userId: string): Registration[] {
  const db = getDatabase();
  return db.getAllSync(
    'SELECT * FROM registrations WHERE userId = ? AND status = ? ORDER BY createdAt DESC',
    [userId, 'confirmed']
  ) as Registration[];
}

export function getRegistrationByEventAndUser(eventId: string, userId: string): Registration | null {
  const db = getDatabase();
  return db.getFirstSync(
    'SELECT * FROM registrations WHERE eventId = ? AND userId = ? AND status = ?',
    [eventId, userId, 'confirmed']
  ) as Registration | null;
}

export function registerForEvent(id: string, eventId: string, userId: string): Registration {
  const db = getDatabase();
  const createdAt = new Date().toISOString();

  db.runSync(
    'INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
    [id, eventId, userId, createdAt, 'confirmed']
  );

  db.runSync(
    'UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?',
    [eventId]
  );

  return { id, eventId, userId, createdAt, status: 'confirmed' };
}

export function cancelRegistration(eventId: string, userId: string): void {
  const db = getDatabase();

  db.runSync(
    'UPDATE registrations SET status = ? WHERE eventId = ? AND userId = ? AND status = ?',
    ['cancelled', eventId, userId, 'confirmed']
  );

  db.runSync(
    'UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?',
    [eventId]
  );
}

export function getRegistrationCountForEvent(eventId: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM registrations WHERE eventId = ? AND status = ?',
    [eventId, 'confirmed']
  );
  return result?.count ?? 0;
}
