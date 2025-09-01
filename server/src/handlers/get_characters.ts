import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type Character } from '../schema';
import { eq } from 'drizzle-orm';

export const getCharacters = async (userId: number): Promise<Character[]> => {
  try {
    // Query characters belonging to the specific user
    const results = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.user_id, userId))
      .execute();

    // Transform the results to match the Character schema (handle JSONB fields)
    return results.map(result => ({
      ...result,
      inventory: result.inventory as Record<string, any> | null,
      equipment: result.equipment as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Get characters failed:', error);
    throw error;
  }
};