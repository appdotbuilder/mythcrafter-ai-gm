import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { type CreateCharacterInput } from '../schema';
import { createCharacter } from '../handlers/create_character';
import { eq } from 'drizzle-orm';

describe('createCharacter', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user for character creation
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  const basicInput: CreateCharacterInput = {
    user_id: 0, // Will be set in tests
    name: 'Thorin Ironshield',
    race: 'Dwarf',
    character_class: 'Fighter',
    level: 1,
    experience_points: 0,
    strength: 16,
    dexterity: 12,
    constitution: 15,
    intelligence: 10,
    wisdom: 13,
    charisma: 8,
    armor_class: 16,
    inventory: { 'sword': 1, 'shield': 1 },
    equipment: { 'weapon': 'longsword', 'armor': 'chainmail' },
    backstory: 'A stout dwarf warrior seeking glory',
    notes: 'Prefers melee combat'
  };

  it('should create a character with all fields', async () => {
    const input = { ...basicInput, user_id: testUserId };
    const result = await createCharacter(input);

    // Verify basic character data
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Thorin Ironshield');
    expect(result.race).toEqual('Dwarf');
    expect(result.character_class).toEqual('Fighter');
    expect(result.level).toEqual(1);
    expect(result.experience_points).toEqual(0);

    // Verify stats
    expect(result.strength).toEqual(16);
    expect(result.dexterity).toEqual(12);
    expect(result.constitution).toEqual(15);
    expect(result.intelligence).toEqual(10);
    expect(result.wisdom).toEqual(13);
    expect(result.charisma).toEqual(8);

    // Verify armor class
    expect(result.armor_class).toEqual(16);

    // Verify optional JSON fields
    expect(result.inventory).toEqual({ 'sword': 1, 'shield': 1 });
    expect(result.equipment).toEqual({ 'weapon': 'longsword', 'armor': 'chainmail' });
    expect(result.backstory).toEqual('A stout dwarf warrior seeking glory');
    expect(result.notes).toEqual('Prefers melee combat');

    // Verify timestamps
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate HP based on constitution and level', async () => {
    const input = {
      ...basicInput,
      user_id: testUserId,
      constitution: 14, // +2 modifier
      level: 3
    };
    const result = await createCharacter(input);

    // Constitution modifier: (14-10)/2 = 2
    // Expected max HP: (3 * 6) + 2 = 20
    expect(result.max_hit_points).toEqual(20);
    expect(result.hit_points).toEqual(20);
  });

  it('should use provided HP values over calculated ones', async () => {
    const input = {
      ...basicInput,
      user_id: testUserId,
      constitution: 14,
      level: 1,
      hit_points: 25,
      max_hit_points: 30
    };
    const result = await createCharacter(input);

    expect(result.hit_points).toEqual(25);
    expect(result.max_hit_points).toEqual(30);
  });

  it('should create character with minimal required fields and defaults', async () => {
    // Note: The CreateCharacterInput expects defaults to be applied by Zod parsing
    // Since we're calling the handler directly, we need to include all required fields
    const minimalInput: CreateCharacterInput = {
      user_id: testUserId,
      name: 'Simple Character',
      level: 1,
      experience_points: 0,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      armor_class: 10
    };
    const result = await createCharacter(minimalInput);

    // Verify required fields
    expect(result.name).toEqual('Simple Character');
    expect(result.user_id).toEqual(testUserId);

    // Verify defaults are applied
    expect(result.level).toEqual(1);
    expect(result.experience_points).toEqual(0);
    expect(result.strength).toEqual(10);
    expect(result.dexterity).toEqual(10);
    expect(result.constitution).toEqual(10);
    expect(result.intelligence).toEqual(10);
    expect(result.wisdom).toEqual(10);
    expect(result.charisma).toEqual(10);
    expect(result.armor_class).toEqual(10);

    // Verify nullable fields are null
    expect(result.race).toBeNull();
    expect(result.character_class).toBeNull();
    expect(result.inventory).toBeNull();
    expect(result.equipment).toBeNull();
    expect(result.backstory).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should save character to database', async () => {
    const input = { ...basicInput, user_id: testUserId };
    const result = await createCharacter(input);

    // Query the database directly to verify persistence
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, result.id))
      .execute();

    expect(characters).toHaveLength(1);
    const savedCharacter = characters[0];
    
    expect(savedCharacter.name).toEqual('Thorin Ironshield');
    expect(savedCharacter.race).toEqual('Dwarf');
    expect(savedCharacter.character_class).toEqual('Fighter');
    expect(savedCharacter.strength).toEqual(16);
    expect(savedCharacter.constitution).toEqual(15);
    expect(savedCharacter.inventory).toEqual({ 'sword': 1, 'shield': 1 });
    expect(savedCharacter.created_at).toBeInstanceOf(Date);
  });

  it('should handle minimum HP calculation correctly', async () => {
    const input = {
      ...basicInput,
      user_id: testUserId,
      constitution: 6, // -2 modifier
      level: 1
    };
    const result = await createCharacter(input);

    // Constitution modifier: (6-10)/2 = -2
    // Expected HP: max(1, (1 * 6) + (-2)) = max(1, 4) = 4
    expect(result.max_hit_points).toEqual(4);
    expect(result.hit_points).toEqual(4);
  });

  it('should handle very low constitution without going below 1 HP', async () => {
    const input = {
      ...basicInput,
      user_id: testUserId,
      constitution: 1, // -5 modifier (extreme case)
      level: 1
    };
    const result = await createCharacter(input);

    // Constitution modifier: (1-10)/2 = -4.5, floored to -5
    // Expected HP: max(1, (1 * 6) + (-5)) = max(1, 1) = 1
    expect(result.max_hit_points).toEqual(1);
    expect(result.hit_points).toEqual(1);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...basicInput,
      user_id: 999999 // Non-existent user ID
    };

    await expect(createCharacter(input)).rejects.toThrow(/user with id 999999 not found/i);
  });

  it('should create high-level character with correct HP scaling', async () => {
    const input = {
      ...basicInput,
      user_id: testUserId,
      constitution: 18, // +4 modifier
      level: 10
    };
    const result = await createCharacter(input);

    // Constitution modifier: (18-10)/2 = 4
    // Expected HP: (10 * 6) + 4 = 64
    expect(result.max_hit_points).toEqual(64);
    expect(result.hit_points).toEqual(64);
    expect(result.level).toEqual(10);
  });
});