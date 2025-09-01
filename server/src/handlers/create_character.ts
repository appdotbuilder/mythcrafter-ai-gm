import { db } from '../db';
import { charactersTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateCharacterInput, type Character } from '../schema';

export const createCharacter = async (input: CreateCharacterInput): Promise<Character> => {
  try {
    // Verify that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // Calculate derived stats if not provided
    const constitutionModifier = Math.floor((input.constitution - 10) / 2);
    const calculatedMaxHP = Math.max(1, (input.level * 6) + constitutionModifier);

    // Use provided HP values or calculated defaults
    const maxHitPoints = input.max_hit_points ?? calculatedMaxHP;
    const hitPoints = input.hit_points ?? maxHitPoints;

    // Insert character record
    const result = await db.insert(charactersTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        race: input.race ?? null,
        character_class: input.character_class ?? null,
        level: input.level,
        experience_points: input.experience_points,
        
        // Core stats
        strength: input.strength,
        dexterity: input.dexterity,
        constitution: input.constitution,
        intelligence: input.intelligence,
        wisdom: input.wisdom,
        charisma: input.charisma,
        
        // Health and resources
        hit_points: hitPoints,
        max_hit_points: maxHitPoints,
        armor_class: input.armor_class,
        
        // Optional fields
        inventory: input.inventory ?? null,
        equipment: input.equipment ?? null,
        backstory: input.backstory ?? null,
        notes: input.notes ?? null
      })
      .returning()
      .execute();

    // Convert the result to match the Character schema type
    const character = result[0];
    return {
      ...character,
      inventory: character.inventory as Record<string, any> | null,
      equipment: character.equipment as Record<string, any> | null
    };
  } catch (error) {
    console.error('Character creation failed:', error);
    throw error;
  }
};