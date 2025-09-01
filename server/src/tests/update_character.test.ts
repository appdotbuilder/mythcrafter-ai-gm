import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { type UpdateCharacterInput } from '../schema';
import { updateCharacter } from '../handlers/update_character';
import { eq } from 'drizzle-orm';

describe('updateCharacter', () => {
  let testUserId: number;
  let testCharacterId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: testUserId,
        name: 'Original Character',
        race: 'Human',
        character_class: 'Fighter',
        level: 1,
        experience_points: 0,
        strength: 15,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 13,
        charisma: 8,
        hit_points: 12,
        max_hit_points: 12,
        armor_class: 16,
        inventory: { items: ['sword', 'shield'] },
        equipment: { weapon: 'longsword', armor: 'chain mail' },
        backstory: 'A brave warrior',
        notes: 'Original notes'
      })
      .returning()
      .execute();
    
    testCharacterId = characterResult[0].id;
  });

  afterEach(resetDB);

  it('should update basic character fields', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      name: 'Updated Character',
      race: 'Elf',
      character_class: 'Wizard',
      level: 3
    };

    const result = await updateCharacter(input);

    expect(result.id).toEqual(testCharacterId);
    expect(result.name).toEqual('Updated Character');
    expect(result.race).toEqual('Elf');
    expect(result.character_class).toEqual('Wizard');
    expect(result.level).toEqual(3);
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update core stats', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      strength: 18,
      dexterity: 16,
      constitution: 14,
      intelligence: 20,
      wisdom: 15,
      charisma: 12
    };

    const result = await updateCharacter(input);

    expect(result.strength).toEqual(18);
    expect(result.dexterity).toEqual(16);
    expect(result.constitution).toEqual(14);
    expect(result.intelligence).toEqual(20);
    expect(result.wisdom).toEqual(15);
    expect(result.charisma).toEqual(12);
  });

  it('should update health and armor values', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      hit_points: 25,
      max_hit_points: 30,
      armor_class: 18,
      experience_points: 1000
    };

    const result = await updateCharacter(input);

    expect(result.hit_points).toEqual(25);
    expect(result.max_hit_points).toEqual(30);
    expect(result.armor_class).toEqual(18);
    expect(result.experience_points).toEqual(1000);
  });

  it('should update JSON fields (inventory and equipment)', async () => {
    const newInventory = { 
      items: ['staff', 'spellbook', 'health potion'],
      gold: 150 
    };
    const newEquipment = { 
      weapon: 'magic staff',
      armor: 'robes',
      ring: 'ring of protection' 
    };

    const input: UpdateCharacterInput = {
      id: testCharacterId,
      inventory: newInventory,
      equipment: newEquipment
    };

    const result = await updateCharacter(input);

    expect(result.inventory).toEqual(newInventory);
    expect(result.equipment).toEqual(newEquipment);
  });

  it('should update text fields (backstory and notes)', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      backstory: 'A powerful wizard who studied at the academy',
      notes: 'Updated notes with new information'
    };

    const result = await updateCharacter(input);

    expect(result.backstory).toEqual('A powerful wizard who studied at the academy');
    expect(result.notes).toEqual('Updated notes with new information');
  });

  it('should handle null values for optional fields', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      race: null,
      character_class: null,
      inventory: null,
      equipment: null,
      backstory: null,
      notes: null
    };

    const result = await updateCharacter(input);

    expect(result.race).toBeNull();
    expect(result.character_class).toBeNull();
    expect(result.inventory).toBeNull();
    expect(result.equipment).toBeNull();
    expect(result.backstory).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should only update provided fields', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      name: 'Partially Updated'
    };

    const result = await updateCharacter(input);

    // Updated field
    expect(result.name).toEqual('Partially Updated');
    
    // Unchanged fields should retain original values
    expect(result.race).toEqual('Human');
    expect(result.character_class).toEqual('Fighter');
    expect(result.level).toEqual(1);
    expect(result.strength).toEqual(15);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      name: 'Multi-Updated Character',
      level: 5,
      strength: 20,
      hit_points: 45,
      max_hit_points: 50,
      experience_points: 6500,
      backstory: 'A seasoned adventurer'
    };

    const result = await updateCharacter(input);

    expect(result.name).toEqual('Multi-Updated Character');
    expect(result.level).toEqual(5);
    expect(result.strength).toEqual(20);
    expect(result.hit_points).toEqual(45);
    expect(result.max_hit_points).toEqual(50);
    expect(result.experience_points).toEqual(6500);
    expect(result.backstory).toEqual('A seasoned adventurer');
  });

  it('should persist changes to database', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      name: 'Database Test Character',
      level: 10
    };

    await updateCharacter(input);

    // Verify the changes were saved to database
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, testCharacterId))
      .execute();

    expect(characters).toHaveLength(1);
    expect(characters[0].name).toEqual('Database Test Character');
    expect(characters[0].level).toEqual(10);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalCharacter = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, testCharacterId))
      .execute();
    
    const originalTimestamp = originalCharacter[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateCharacterInput = {
      id: testCharacterId,
      name: 'Timestamp Test'
    };

    const result = await updateCharacter(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent character', async () => {
    const input: UpdateCharacterInput = {
      id: 99999, // Non-existent ID
      name: 'Should Fail'
    };

    expect(updateCharacter(input)).rejects.toThrow(/Character with id 99999 not found/i);
  });

  it('should handle zero values correctly', async () => {
    const input: UpdateCharacterInput = {
      id: testCharacterId,
      hit_points: 0,
      experience_points: 0
    };

    const result = await updateCharacter(input);

    expect(result.hit_points).toEqual(0);
    expect(result.experience_points).toEqual(0);
  });
});