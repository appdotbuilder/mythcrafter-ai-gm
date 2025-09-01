import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type Character } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getCharacter(characterId: number, userId: number): Promise<Character | null> {
  try {
    // Query for character that belongs to the specified user
    const results = await db.select()
      .from(charactersTable)
      .where(and(
        eq(charactersTable.id, characterId),
        eq(charactersTable.user_id, userId)
      ))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const character = results[0];
    
    // Return the character with proper type structure
    return {
      id: character.id,
      user_id: character.user_id,
      name: character.name,
      race: character.race,
      character_class: character.character_class,
      level: character.level,
      experience_points: character.experience_points,
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      hit_points: character.hit_points,
      max_hit_points: character.max_hit_points,
      armor_class: character.armor_class,
      inventory: character.inventory as Record<string, any> | null,
      equipment: character.equipment as Record<string, any> | null,
      backstory: character.backstory,
      notes: character.notes,
      created_at: character.created_at,
      updated_at: character.updated_at
    };
  } catch (error) {
    console.error('Get character failed:', error);
    throw error;
  }
}