import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { type CreateUserInput, type CreateCharacterInput } from '../schema';
import { getCharacters } from '../handlers/get_characters';

// Test user data
const testUser1: CreateUserInput = {
  username: 'testuser1',
  email: 'user1@test.com',
  password: 'password123'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'user2@test.com',
  password: 'password456'
};

// Test character data
const testCharacter1: CreateCharacterInput = {
  user_id: 1, // Will be set after creating user
  name: 'Aragorn',
  race: 'Human',
  character_class: 'Ranger',
  level: 5,
  experience_points: 6500,
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 12,
  wisdom: 13,
  charisma: 11,
  hit_points: 45,
  max_hit_points: 45,
  armor_class: 15,
  backstory: 'A ranger from the North',
  notes: 'Skilled tracker and swordsman'
};

const testCharacter2: CreateCharacterInput = {
  user_id: 1, // Will be set after creating user
  name: 'Gandalf',
  race: 'Wizard',
  character_class: 'Mage',
  level: 10,
  experience_points: 85000,
  strength: 10,
  dexterity: 12,
  constitution: 14,
  intelligence: 18,
  wisdom: 16,
  charisma: 15,
  hit_points: 60,
  max_hit_points: 60,
  armor_class: 12,
  backstory: 'A wise wizard',
  notes: 'Master of magic'
};

const testCharacter3: CreateCharacterInput = {
  user_id: 2, // Different user
  name: 'Legolas',
  race: 'Elf',
  character_class: 'Archer',
  level: 7,
  experience_points: 23000,
  strength: 12,
  dexterity: 18,
  constitution: 13,
  intelligence: 14,
  wisdom: 15,
  charisma: 13,
  hit_points: 50,
  max_hit_points: 50,
  armor_class: 16,
  backstory: 'An elven archer',
  notes: 'Expert marksman'
};

describe('getCharacters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no characters', async () => {
    // Create user but no characters
    await db.insert(usersTable)
      .values({
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashedpassword123'
      })
      .execute();

    const result = await getCharacters(1);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return single character for user with one character', async () => {
    // Create user
    await db.insert(usersTable)
      .values({
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashedpassword123'
      })
      .execute();

    // Create character
    await db.insert(charactersTable)
      .values({
        user_id: 1,
        name: testCharacter1.name,
        race: testCharacter1.race,
        character_class: testCharacter1.character_class,
        level: testCharacter1.level,
        experience_points: testCharacter1.experience_points,
        strength: testCharacter1.strength,
        dexterity: testCharacter1.dexterity,
        constitution: testCharacter1.constitution,
        intelligence: testCharacter1.intelligence,
        wisdom: testCharacter1.wisdom,
        charisma: testCharacter1.charisma,
        hit_points: testCharacter1.hit_points,
        max_hit_points: testCharacter1.max_hit_points,
        armor_class: testCharacter1.armor_class,
        backstory: testCharacter1.backstory,
        notes: testCharacter1.notes
      })
      .execute();

    const result = await getCharacters(1);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Aragorn');
    expect(result[0].race).toEqual('Human');
    expect(result[0].character_class).toEqual('Ranger');
    expect(result[0].level).toEqual(5);
    expect(result[0].experience_points).toEqual(6500);
    expect(result[0].strength).toEqual(16);
    expect(result[0].user_id).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple characters for user with multiple characters', async () => {
    // Create user
    await db.insert(usersTable)
      .values({
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashedpassword123'
      })
      .execute();

    // Create multiple characters
    await db.insert(charactersTable)
      .values([
        {
          user_id: 1,
          name: testCharacter1.name,
          race: testCharacter1.race,
          character_class: testCharacter1.character_class,
          level: testCharacter1.level,
          experience_points: testCharacter1.experience_points,
          strength: testCharacter1.strength,
          dexterity: testCharacter1.dexterity,
          constitution: testCharacter1.constitution,
          intelligence: testCharacter1.intelligence,
          wisdom: testCharacter1.wisdom,
          charisma: testCharacter1.charisma,
          hit_points: testCharacter1.hit_points,
          max_hit_points: testCharacter1.max_hit_points,
          armor_class: testCharacter1.armor_class,
          backstory: testCharacter1.backstory,
          notes: testCharacter1.notes
        },
        {
          user_id: 1,
          name: testCharacter2.name,
          race: testCharacter2.race,
          character_class: testCharacter2.character_class,
          level: testCharacter2.level,
          experience_points: testCharacter2.experience_points,
          strength: testCharacter2.strength,
          dexterity: testCharacter2.dexterity,
          constitution: testCharacter2.constitution,
          intelligence: testCharacter2.intelligence,
          wisdom: testCharacter2.wisdom,
          charisma: testCharacter2.charisma,
          hit_points: testCharacter2.hit_points,
          max_hit_points: testCharacter2.max_hit_points,
          armor_class: testCharacter2.armor_class,
          backstory: testCharacter2.backstory,
          notes: testCharacter2.notes
        }
      ])
      .execute();

    const result = await getCharacters(1);

    expect(result).toHaveLength(2);
    
    const characterNames = result.map(char => char.name);
    expect(characterNames).toContain('Aragorn');
    expect(characterNames).toContain('Gandalf');
    
    // Verify all characters belong to the correct user
    result.forEach(character => {
      expect(character.user_id).toEqual(1);
      expect(character.id).toBeDefined();
      expect(character.created_at).toBeInstanceOf(Date);
      expect(character.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return characters belonging to the specified user', async () => {
    // Create two users
    await db.insert(usersTable)
      .values([
        {
          username: testUser1.username,
          email: testUser1.email,
          password_hash: 'hashedpassword123'
        },
        {
          username: testUser2.username,
          email: testUser2.email,
          password_hash: 'hashedpassword456'
        }
      ])
      .execute();

    // Create characters for both users
    await db.insert(charactersTable)
      .values([
        {
          user_id: 1,
          name: testCharacter1.name,
          race: testCharacter1.race,
          character_class: testCharacter1.character_class,
          level: testCharacter1.level,
          experience_points: testCharacter1.experience_points,
          strength: testCharacter1.strength,
          dexterity: testCharacter1.dexterity,
          constitution: testCharacter1.constitution,
          intelligence: testCharacter1.intelligence,
          wisdom: testCharacter1.wisdom,
          charisma: testCharacter1.charisma,
          hit_points: testCharacter1.hit_points,
          max_hit_points: testCharacter1.max_hit_points,
          armor_class: testCharacter1.armor_class,
          backstory: testCharacter1.backstory,
          notes: testCharacter1.notes
        },
        {
          user_id: 2,
          name: testCharacter3.name,
          race: testCharacter3.race,
          character_class: testCharacter3.character_class,
          level: testCharacter3.level,
          experience_points: testCharacter3.experience_points,
          strength: testCharacter3.strength,
          dexterity: testCharacter3.dexterity,
          constitution: testCharacter3.constitution,
          intelligence: testCharacter3.intelligence,
          wisdom: testCharacter3.wisdom,
          charisma: testCharacter3.charisma,
          hit_points: testCharacter3.hit_points,
          max_hit_points: testCharacter3.max_hit_points,
          armor_class: testCharacter3.armor_class,
          backstory: testCharacter3.backstory,
          notes: testCharacter3.notes
        }
      ])
      .execute();

    // Get characters for user 1
    const user1Characters = await getCharacters(1);
    expect(user1Characters).toHaveLength(1);
    expect(user1Characters[0].name).toEqual('Aragorn');
    expect(user1Characters[0].user_id).toEqual(1);

    // Get characters for user 2
    const user2Characters = await getCharacters(2);
    expect(user2Characters).toHaveLength(1);
    expect(user2Characters[0].name).toEqual('Legolas');
    expect(user2Characters[0].user_id).toEqual(2);
  });

  it('should handle characters with default values correctly', async () => {
    // Create user
    await db.insert(usersTable)
      .values({
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashedpassword123'
      })
      .execute();

    // Create character with minimal data (relying on defaults)
    await db.insert(charactersTable)
      .values({
        user_id: 1,
        name: 'Basic Character'
      })
      .execute();

    const result = await getCharacters(1);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Character');
    expect(result[0].level).toEqual(1);
    expect(result[0].experience_points).toEqual(0);
    expect(result[0].strength).toEqual(10);
    expect(result[0].dexterity).toEqual(10);
    expect(result[0].constitution).toEqual(10);
    expect(result[0].intelligence).toEqual(10);
    expect(result[0].wisdom).toEqual(10);
    expect(result[0].charisma).toEqual(10);
    expect(result[0].hit_points).toEqual(10);
    expect(result[0].max_hit_points).toEqual(10);
    expect(result[0].armor_class).toEqual(10);
    expect(result[0].race).toBeNull();
    expect(result[0].character_class).toBeNull();
    expect(result[0].backstory).toBeNull();
    expect(result[0].notes).toBeNull();
  });

  it('should return empty array for non-existent user', async () => {
    // Don't create any users, just try to get characters for non-existent user
    const result = await getCharacters(999);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });
});