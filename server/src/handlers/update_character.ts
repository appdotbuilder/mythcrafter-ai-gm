import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type UpdateCharacterInput, type Character } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCharacter = async (input: UpdateCharacterInput): Promise<Character> => {
  try {
    // Extract the id and prepare update data
    const { id, ...updateData } = input;

    // Build the update object, only including fields that are provided
    const updateFields: any = {};
    
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.race !== undefined) updateFields.race = updateData.race;
    if (updateData.character_class !== undefined) updateFields.character_class = updateData.character_class;
    if (updateData.level !== undefined) updateFields.level = updateData.level;
    if (updateData.experience_points !== undefined) updateFields.experience_points = updateData.experience_points;
    
    // Core stats
    if (updateData.strength !== undefined) updateFields.strength = updateData.strength;
    if (updateData.dexterity !== undefined) updateFields.dexterity = updateData.dexterity;
    if (updateData.constitution !== undefined) updateFields.constitution = updateData.constitution;
    if (updateData.intelligence !== undefined) updateFields.intelligence = updateData.intelligence;
    if (updateData.wisdom !== undefined) updateFields.wisdom = updateData.wisdom;
    if (updateData.charisma !== undefined) updateFields.charisma = updateData.charisma;
    
    // Health and resources
    if (updateData.hit_points !== undefined) updateFields.hit_points = updateData.hit_points;
    if (updateData.max_hit_points !== undefined) updateFields.max_hit_points = updateData.max_hit_points;
    if (updateData.armor_class !== undefined) updateFields.armor_class = updateData.armor_class;
    
    // JSON fields
    if (updateData.inventory !== undefined) updateFields.inventory = updateData.inventory;
    if (updateData.equipment !== undefined) updateFields.equipment = updateData.equipment;
    if (updateData.backstory !== undefined) updateFields.backstory = updateData.backstory;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
    
    // Always update the updated_at timestamp
    updateFields.updated_at = new Date();

    // Update the character record
    const result = await db.update(charactersTable)
      .set(updateFields)
      .where(eq(charactersTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Character with id ${id} not found`);
    }

    // Convert the database result to match our schema types
    const character = result[0];
    return {
      ...character,
      inventory: character.inventory as Record<string, any> | null,
      equipment: character.equipment as Record<string, any> | null
    };
  } catch (error) {
    console.error('Character update failed:', error);
    throw error;
  }
};