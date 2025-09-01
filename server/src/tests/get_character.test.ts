import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { getCharacter } from '../handlers/get_character';
import { eq } from 'drizzle-orm';

describe('getCharacter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return character for valid user', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Test Hero',
        race: 'Human',
        character_class: 'Fighter',
        level: 5,
        experience_points: 1000,
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 12,
        wisdom: 13,
        charisma: 10,
        hit_points: 45,
        max_hit_points: 50,
        armor_class: 16,
        inventory: { sword: 1, potion: 3 },
        equipment: { weapon: 'longsword', armor: 'chainmail' },
        backstory: 'A brave warrior from the north',
        notes: 'Prefers melee combat'
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Test getting the character
    const result = await getCharacter(characterId, userId);

    // Verify all fields are returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(characterId);
    expect(result!.user_id).toBe(userId);
    expect(result!.name).toBe('Test Hero');
    expect(result!.race).toBe('Human');
    expect(result!.character_class).toBe('Fighter');
    expect(result!.level).toBe(5);
    expect(result!.experience_points).toBe(1000);
    expect(result!.strength).toBe(16);
    expect(result!.dexterity).toBe(14);
    expect(result!.constitution).toBe(15);
    expect(result!.intelligence).toBe(12);
    expect(result!.wisdom).toBe(13);
    expect(result!.charisma).toBe(10);
    expect(result!.hit_points).toBe(45);
    expect(result!.max_hit_points).toBe(50);
    expect(result!.armor_class).toBe(16);
    expect(result!.inventory).toEqual({ sword: 1, potion: 3 });
    expect(result!.equipment).toEqual({ weapon: 'longsword', armor: 'chainmail' });
    expect(result!.backstory).toBe('A brave warrior from the north');
    expect(result!.notes).toBe('Prefers melee combat');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent character', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Try to get a character that doesn't exist
    const result = await getCharacter(999, userId);

    expect(result).toBeNull();
  });

  it('should return null when character belongs to different user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a character for user1
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: user1Id,
        name: 'User1 Character',
        race: 'Elf',
        character_class: 'Wizard'
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Try to get the character as user2
    const result = await getCharacter(characterId, user2Id);

    expect(result).toBeNull();
  });

  it('should handle character with null optional fields', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a character with minimal data (null optional fields)
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Basic Character',
        race: null,
        character_class: null,
        inventory: null,
        equipment: null,
        backstory: null,
        notes: null
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Get the character
    const result = await getCharacter(characterId, userId);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Basic Character');
    expect(result!.race).toBeNull();
    expect(result!.character_class).toBeNull();
    expect(result!.inventory).toBeNull();
    expect(result!.equipment).toBeNull();
    expect(result!.backstory).toBeNull();
    expect(result!.notes).toBeNull();
    // Default values should still be present
    expect(result!.level).toBe(1);
    expect(result!.experience_points).toBe(0);
    expect(result!.strength).toBe(10);
    expect(result!.armor_class).toBe(10);
  });

  it('should verify character exists in database after retrieval', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Test Character',
        race: 'Dwarf',
        character_class: 'Cleric'
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Get the character through handler
    const result = await getCharacter(characterId, userId);

    // Verify it was returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(characterId);

    // Verify the character actually exists in the database
    const dbCharacter = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characterId))
      .execute();

    expect(dbCharacter).toHaveLength(1);
    expect(dbCharacter[0].name).toBe('Test Character');
    expect(dbCharacter[0].race).toBe('Dwarf');
    expect(dbCharacter[0].character_class).toBe('Cleric');
  });
});