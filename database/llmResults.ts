import { getDatabase } from './init';

export interface LLMResult {
  id: string;
  eventId?: string;
  userId: string;
  type: 'search' | 'recommendation' | 'planning' | 'qa';
  inputText: string;
  outputText: string;
  createdAt: string;
}

export function saveLLMResult(result: LLMResult): void {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [result.id, result.eventId ?? null, result.userId, result.type, result.inputText, result.outputText, result.createdAt]
  );
}

export function getCachedLLMResult(userId: string, type: string, inputText: string): LLMResult | null {
  const db = getDatabase();
  return db.getFirstSync(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText]
  ) as LLMResult | null;
}

export function getLLMResultsByUser(userId: string, type?: string): LLMResult[] {
  const db = getDatabase();
  if (type) {
    return db.getAllSync(
      'SELECT * FROM llm_results WHERE userId = ? AND type = ? ORDER BY createdAt DESC',
      [userId, type]
    ) as LLMResult[];
  }
  return db.getAllSync(
    'SELECT * FROM llm_results WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  ) as LLMResult[];
}
